/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';

interface UsageMetadata {
  input_tokens?: number;
  output_tokens?: number;
}

/** Adds up input and output tokens across every LLM call in an agent run. */
export class TokenUsageCallbackHandler extends BaseCallbackHandler {
  name = 'token_usage_callback_handler';
  inputTokens = 0;
  outputTokens = 0;
  llmCalls = 0;

  handleLLMEnd(output: LLMResult): void {
    this.llmCalls++;
    for (const generation of output.generations.flat()) {
      const usage = (generation as { message?: { usage_metadata?: UsageMetadata } }).message
        ?.usage_metadata;
      this.inputTokens += usage?.input_tokens ?? 0;
      this.outputTokens += usage?.output_tokens ?? 0;
    }
  }
}
