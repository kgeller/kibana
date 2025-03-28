/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { StoryFn } from '@storybook/react';
import { BurnRateRuleParams } from '../../typings';
import { BurnRateRuleEditor as Component } from './burn_rate_rule_editor';
import { KibanaReactStorybookDecorator } from '../../utils/kibana_react.storybook_decorator';

export default {
  component: Component,
  title: 'app/SLO/BurnRateRule',
  decorators: [KibanaReactStorybookDecorator],
};

const Template: StoryFn<typeof Component> = () => (
  <Component
    ruleParams={{} as BurnRateRuleParams}
    setRuleParams={() => {}}
    errors={{ sloId: [], windows: [] }}
  />
);

const defaultProps = {};

export const BurnRateRuleEditor = {
  render: Template,
  args: defaultProps,
};
