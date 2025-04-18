/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ExperimentalFeatures } from '../../../../common/experimental_features';
import { allowedExperimentalValues } from '../../../../common/experimental_features';

export const useIsExperimentalFeatureEnabled = jest
  .fn()
  .mockImplementation((feature: keyof ExperimentalFeatures): boolean => {
    if (feature in allowedExperimentalValues) {
      return allowedExperimentalValues[feature];
    }

    throw new Error(`Invalid experimental value ${feature}}`);
  });

export const useEnableExperimental = jest.fn(() => ({ newDataViewPickerEnabled: false }));
