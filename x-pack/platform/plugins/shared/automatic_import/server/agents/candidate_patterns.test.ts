/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { findCandidatePatterns, formatCandidatePatterns } from './candidate_patterns';

describe('candidate patterns', () => {
  it('finds a grok pattern for uniform log lines and formats it for the generator', () => {
    const samples = Array.from(
      { length: 20 },
      (_, i) =>
        `2026-11-17T10:00:${String(i).padStart(
          2,
          '0'
        )}Z INFO [auth] user=u${i} action=login status=success duration=${i}ms`
    );

    const patterns = findCandidatePatterns(samples);

    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].coverage).toBe(1);
    expect(patterns[0].grok).toContain('%{');
    expect(formatCandidatePatterns(patterns)).toMatch(/^<candidate_patterns>[\s\S]*grok: /);
    expect(formatCandidatePatterns([])).toBe('');
  });
});
