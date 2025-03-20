/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable react/jsx-no-literals */

import React from 'react';
import { EuiTabs, EuiTab, EuiSpacer } from '@elastic/eui';
import { PluginTemplateWrapper } from '../../common/components/plugin_template_wrapper';
import { SecurityPageName } from '../../app/types';
import { SecurityRoutePageWrapper } from '../../common/components/security_route_page_wrapper';
import { IntegrationsView } from './integrations';

export const IntegrationsPageContainer = React.memo(() => {
  return (
    <PluginTemplateWrapper>
      <SecurityRoutePageWrapper pageName={SecurityPageName.configurations}>
        <EuiTabs>
          <EuiTab isSelected={true}>Integrations</EuiTab>
          <EuiTab>Knowledge sources</EuiTab>
          <EuiTab>Rules</EuiTab>
        </EuiTabs>
        <EuiSpacer size="l" />
        <IntegrationsView />
      </SecurityRoutePageWrapper>
    </PluginTemplateWrapper>
  );
});
IntegrationsPageContainer.displayName = 'IntegrationsPageContainer';
