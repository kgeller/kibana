/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ActionsClientLlm } from '@kbn/langchain/server';
import type { Logger } from '@kbn/core/server';
import type { DefendInsightType } from '@kbn/elastic-assistant-common';

import { DefendInsightsGenerationPrompts } from '../helpers/prompts/incompatible_antivirus';
import type { GraphState } from '../../types';
import { getMaxHallucinationFailuresReached } from '../../helpers/get_max_hallucination_failures_reached';
import { getMaxRetriesReached } from '../../helpers/get_max_retries_reached';
import { getChainWithFormatInstructions } from '../helpers/get_chain_with_format_instructions';
import { extractJson } from '../helpers/extract_json';
import { getCombined } from '../helpers/get_combined';
import { generationsAreRepeating } from '../helpers/generations_are_repeating';
import { parseCombinedOrThrow } from '../helpers/parse_combined_or_throw';
import { responseIsHallucinated } from '../helpers/response_is_hallucinated';
import { discardPreviousRefinements } from './helpers/discard_previous_refinements';
import { getCombinedRefinePrompt } from './helpers/get_combined_refine_prompt';
import { getUseUnrefinedResults } from './helpers/get_use_unrefined_results';

export const getRefineNode = ({
  insightType,
  llm,
  logger,
  prompts,
}: {
  insightType: DefendInsightType;
  llm: ActionsClientLlm;
  logger?: Logger;
  prompts: DefendInsightsGenerationPrompts;
}): ((state: GraphState) => Promise<GraphState>) => {
  const refine = async (state: GraphState): Promise<GraphState> => {
    logger?.debug(() => '---REFINE---');

    const {
      prompt,
      combinedRefinements,
      generationAttempts,
      hallucinationFailures,
      maxGenerationAttempts,
      maxHallucinationFailures,
      maxRepeatedGenerations,
      refinements,
      refinePrompt,
      continuePrompt,
      unrefinedResults,
    } = state;

    let combinedResponse = ''; // mutable, because it must be accessed in the catch block
    let partialResponse = ''; // mutable, because it must be accessed in the catch block

    try {
      const query = getCombinedRefinePrompt({
        prompt,
        combinedRefinements,
        continuePrompt,
        refinePrompt,
        unrefinedResults,
      });

      const { chain, formatInstructions, llmType } = getChainWithFormatInstructions({
        insightType,
        llm,
        prompts,
      });

      logger?.debug(
        () => `refine node is invoking the chain (${llmType}), attempt ${generationAttempts}`
      );

      const rawResponse = (await chain.invoke({
        format_instructions: formatInstructions,
        query,
      })) as unknown as string;

      // LOCAL MUTATION:
      partialResponse = extractJson(rawResponse); // remove the surrounding ```json```

      // if the response is hallucinated, discard it:
      if (responseIsHallucinated(partialResponse)) {
        logger?.debug(
          () =>
            `refine node detected a hallucination (${llmType}), on attempt ${generationAttempts}; discarding the accumulated refinements and starting over`
        );

        return discardPreviousRefinements({
          generationAttempts,
          hallucinationFailures,
          isHallucinationDetected: true,
          state,
        });
      }

      // if the refinements are repeating, discard previous refinements and start over:
      if (
        generationsAreRepeating({
          currentGeneration: partialResponse,
          previousGenerations: refinements,
          sampleLastNGenerations: maxRepeatedGenerations - 1,
        })
      ) {
        logger?.debug(
          () =>
            `refine node detected (${llmType}), detected ${maxRepeatedGenerations} repeated generations on attempt ${generationAttempts}; discarding the accumulated results and starting over`
        );

        // discard the accumulated results and start over:
        return discardPreviousRefinements({
          generationAttempts,
          hallucinationFailures,
          isHallucinationDetected: false,
          state,
        });
      }

      // LOCAL MUTATION:
      combinedResponse = getCombined({ combinedGenerations: combinedRefinements, partialResponse }); // combine the new response with the previous ones

      const defendInsights = parseCombinedOrThrow({
        insightType,
        combinedResponse,
        generationAttempts,
        llmType,
        logger,
        nodeName: 'refine',
        prompts,
      });

      return {
        ...state,
        insights: defendInsights, // the final, refined answer
        generationAttempts: generationAttempts + 1,
        combinedRefinements: combinedResponse,
        refinements: [...refinements, partialResponse],
      };
    } catch (error) {
      const parsingError = `refine node is unable to parse (${llm._llmType()}) response from attempt ${generationAttempts}; (this may be an incomplete response from the model): ${error}`;
      logger?.debug(() => parsingError); // logged at debug level because the error is expected when the model returns an incomplete response

      const maxRetriesReached = getMaxRetriesReached({
        generationAttempts: generationAttempts + 1,
        maxGenerationAttempts,
      });

      const maxHallucinationFailuresReached = getMaxHallucinationFailuresReached({
        hallucinationFailures,
        maxHallucinationFailures,
      });

      // we will use the unrefined results if we have reached the maximum number of retries or hallucination failures:
      const useUnrefinedResults = getUseUnrefinedResults({
        maxHallucinationFailuresReached,
        maxRetriesReached,
      });

      if (useUnrefinedResults) {
        logger?.debug(
          () =>
            `refine node is using unrefined results response (${llm._llmType()}) from attempt ${generationAttempts}, because all attempts have been used`
        );
      }

      return {
        ...state,
        insights: useUnrefinedResults ? unrefinedResults : null,
        combinedRefinements: combinedResponse,
        errors: [...state.errors, parsingError],
        generationAttempts: generationAttempts + 1,
        refinements: [...refinements, partialResponse],
      };
    }
  };

  return refine;
};
