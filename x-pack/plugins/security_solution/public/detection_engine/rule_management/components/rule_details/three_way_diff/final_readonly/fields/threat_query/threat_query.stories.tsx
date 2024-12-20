/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { Story } from '@storybook/react';
import { FieldFinalReadOnly } from '../../field_final_readonly';
import type { DiffableRule } from '../../../../../../../../../common/api/detection_engine';
import { ThreatQueryReadOnly } from './threat_query';
import {
  dataSourceWithDataView,
  dataSourceWithIndexPatterns,
  inlineKqlQuery,
  mockDataView,
  mockThreatMatchRule,
} from '../../storybook/mocks';
import { ThreeWayDiffStorybookProviders } from '../../storybook/three_way_diff_storybook_providers';

export default {
  component: ThreatQueryReadOnly,
  title: 'Rule Management/Prebuilt Rules/Upgrade Flyout/ThreeWayDiff/FieldReadOnly/threat_query',
};

interface TemplateProps {
  finalDiffableRule: DiffableRule;
  kibanaServicesOverrides?: Record<string, unknown>;
}

const Template: Story<TemplateProps> = (args) => {
  return (
    <ThreeWayDiffStorybookProviders
      kibanaServicesOverrides={args.kibanaServicesOverrides}
      finalDiffableRule={args.finalDiffableRule}
      fieldName="threat_query"
    >
      <FieldFinalReadOnly />
    </ThreeWayDiffStorybookProviders>
  );
};

export const ThreatQueryWithIndexPatterns = Template.bind({});

ThreatQueryWithIndexPatterns.args = {
  finalDiffableRule: mockThreatMatchRule({
    threat_query: inlineKqlQuery,
    data_source: dataSourceWithIndexPatterns,
  }),
  kibanaServicesOverrides: {
    data: {
      dataViews: {
        create: async () => mockDataView(),
      },
    },
  },
};

export const ThreatQueryWithDataView = Template.bind({});

ThreatQueryWithDataView.args = {
  finalDiffableRule: mockThreatMatchRule({
    threat_query: inlineKqlQuery,
    data_source: dataSourceWithDataView,
  }),
  kibanaServicesOverrides: {
    data: {
      dataViews: {
        get: async () => mockDataView(),
      },
    },
  },
};
