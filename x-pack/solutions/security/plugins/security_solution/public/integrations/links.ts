/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { SecurityPageName, CONFIGURATIONS_PATH, SECURITY_FEATURE_ID } from '../../common/constants';
import type { LinkItem } from '../common/links/types';

export const integrationsLinks: LinkItem = {
  id: SecurityPageName.configurations,
  title: 'integrations',
  path: CONFIGURATIONS_PATH,
  capabilities: [`${SECURITY_FEATURE_ID}.show`],
  globalSearchKeywords: [
    i18n.translate('xpack.securitySolution.appLinks.configurations', {
      defaultMessage: 'Configurations',
    }),
  ],
  skipUrlState: false,
  // hideTimeline: true,
};
