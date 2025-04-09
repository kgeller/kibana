/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IntegrationCardItem } from '@kbn/fleet-plugin/public';

export interface Tab {
  category: string;
  featuredCardIds?: Array<IntegrationCardItem['id']>;
  iconType?: string;
  id: IntegrationTabId;
  label: string;
  overflow?: 'hidden' | 'scroll';
  showSearchTools?: boolean;
  subCategory?: string;
  sortByFeaturedIntegrations: boolean;
  height?: string;
}

export enum IntegrationTabId {
  recommended = 'recommended',
  recommendedSearchAILake = 'recommendedSearchAILake',
  network = 'network',
  user = 'user',
  endpoint = 'endpoint',
  cloud = 'cloud',
  threatIntel = 'threatIntel',
  all = 'all',
}

export interface IntegrationCardMetadata {
  installedIntegrationsCount: number;
  isAgentRequired: boolean;
}
