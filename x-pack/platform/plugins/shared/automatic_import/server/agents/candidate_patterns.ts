/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  extractGrokPatternDangerouslySlow,
  getGrokPattern,
  groupMessagesByPattern,
} from '@kbn/grok-heuristics';
import { extractDissectPattern, serializeAST } from '@kbn/dissect-heuristics';

// The extractors are synchronous and slow on long or many lines, so the input is capped.
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

export interface CandidatePattern {
  coverage: number;
  grok: string;
  dissect?: string;
}

/**
 * Runs Streams' non-AI grok and dissect pattern finders on the samples and returns a
 * draft pattern per message group, for the pipeline generator to start from.
 */
export const findCandidatePatterns = (samples: string[]): CandidatePattern[] => {
  const messages = samples
    .slice(0, MAX_MESSAGES)
    .map((sample) => sample.slice(0, MAX_MESSAGE_LENGTH))
    .filter((sample) => sample.trim().length > 0);
  if (messages.length === 0) return [];

  return groupMessagesByPattern(messages).flatMap((group, index) => {
    const grok = getGrokPattern(extractGrokPatternDangerouslySlow(group.messages));
    if (!grok) return [];
    const dissect =
      index === 0 ? serializeAST(extractDissectPattern(group.messages).ast) : undefined;
    return [{ coverage: group.probability, grok, ...(dissect ? { dissect } : {}) }];
  });
};

/** Formats candidate patterns as a context block for the pipeline generator. */
export const formatCandidatePatterns = (patterns: CandidatePattern[]): string => {
  if (patterns.length === 0) return '';
  const lines = patterns.map(
    ({ coverage, grok, dissect }, index) =>
      `${index + 1}. Matches the structure of ~${Math.round(coverage * 100)}% of samples.\n` +
      `   grok: ${grok}${dissect ? `\n   dissect: ${dissect}` : ''}`
  );
  return [
    '<candidate_patterns>',
    'Draft patterns from a non-AI pattern finder. Field names are placeholders. Use them as a starting point for parsing: check them with test_pipeline, rename the fields, and fix any wrong separators. Ignore them if they do not fit.',
    ...lines,
    '</candidate_patterns>',
  ].join('\n');
};
