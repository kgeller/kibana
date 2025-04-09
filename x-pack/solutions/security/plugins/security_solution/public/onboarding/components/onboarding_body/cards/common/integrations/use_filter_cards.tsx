/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AvailablePackagesHookType, IntegrationCardItem } from '@kbn/fleet-plugin/public';
import React from 'react';
import { EuiSkeletonText } from '@elastic/eui';
import { withLazyHook } from '../../../../../../common/components/with_lazy_hook';
import { LOADING_SKELETON_TEXT_LINES } from './constants';
import type { IntegrationCardMetadata } from './types';
import type { UseSelectedTabReturn } from './use_selected_tab';

export const useFilterCards = ({
  useAvailablePackages,
  featuredCardIds,
  prereleaseIntegrationsEnabled,
}: {
  useAvailablePackages: AvailablePackagesHookType;
  featuredCardIds?: string[];
  prereleaseIntegrationsEnabled: boolean;
}) => {
  const useAvailablePackagesResult = useAvailablePackages({
    prereleaseIntegrationsEnabled,
  });

  const allowedIntegrations = useAvailablePackagesResult.filteredCards.filter(
    (card) => (featuredCardIds?.includes(card.name) || featuredCardIds?.includes(card.id)) ?? true
  );
  return { useAvailablePackagesResult, allowedIntegrations };
};

export type RenderChildrenType = React.FC<{
  allowedIntegrations: IntegrationCardItem[];
  useAvailablePackagesResult: ReturnType<AvailablePackagesHookType>;
  checkCompleteMetadata: IntegrationCardMetadata;
  featuredCardIds?: string[];
  useSelectedTabResult: UseSelectedTabReturn;
}>;

export const AvailableCardsComponent = ({
  useAvailablePackages,
  renderChildren,
  prereleaseIntegrationsEnabled,
  checkCompleteMetadata,
  useSelectedTabResult,
}: {
  useAvailablePackages: AvailablePackagesHookType;
  renderChildren: RenderChildrenType;
  prereleaseIntegrationsEnabled: boolean;
  checkCompleteMetadata: IntegrationCardMetadata;
  useSelectedTabResult: UseSelectedTabReturn;
}) => {
  const { useAvailablePackagesResult, allowedIntegrations } = useFilterCards({
    featuredCardIds: useSelectedTabResult.selectedTab?.featuredCardIds,
    useAvailablePackages,
    prereleaseIntegrationsEnabled,
  });

  return renderChildren({
    allowedIntegrations,
    useAvailablePackagesResult,
    checkCompleteMetadata,
    useSelectedTabResult,
  });
};

export const WithFilteredIntegrations = withLazyHook(
  AvailableCardsComponent,
  () => import('@kbn/fleet-plugin/public').then((module) => module.AvailablePackagesHook()),
  <EuiSkeletonText
    data-test-subj="loadingPackages"
    isLoading={true}
    lines={LOADING_SKELETON_TEXT_LINES}
  />
);
