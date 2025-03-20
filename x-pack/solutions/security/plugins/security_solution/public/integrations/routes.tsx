/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CONFIGURATIONS_PATH } from '../../common/constants';
import type { SecuritySubPluginRoutes } from '../app/types';
import { SecurityPageName } from '../app/types';
import { withSecurityRoutePageWrapper } from '../common/components/security_route_page_wrapper';
import { IntegrationsPageContainer } from './components/integrations_container';

export const routes: SecuritySubPluginRoutes = [
  {
    path: CONFIGURATIONS_PATH,
    component: withSecurityRoutePageWrapper(
      IntegrationsPageContainer,
      SecurityPageName.configurations
    ),
  },
];
