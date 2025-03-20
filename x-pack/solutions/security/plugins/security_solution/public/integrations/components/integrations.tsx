/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable react/jsx-no-literals */

import React, { lazy, useState } from 'react';
import {
  EuiFacetButton,
  EuiFacetGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSkeletonText,
} from '@elastic/eui';
import { css } from '@emotion/react';
import type { AvailablePackagesHookType, IntegrationCardItem } from '@kbn/fleet-plugin/public';
import { installationStatuses } from '@kbn/fleet-plugin/public';
import { withLazyHook } from '../../common/components/with_lazy_hook';
import { AVAILABLE_INTEGRATIONS } from '../constants';
import { LOADING_SKELETON_TEXT_LINES } from './constants';
import { useIntegrationCardList } from './use_integration_card_list';

export interface IntegrationsPageProps {
  useAvailablePackages: AvailablePackagesHookType;
}

export const PackageListGrid = lazy(async () => ({
  default: await import('@kbn/fleet-plugin/public')
    .then((module) => module.PackageList())
    .then((pkg) => pkg.PackageListGrid),
}));

export type ViewFacet = 'all' | 'installed';

export const IntegrationsPage = React.memo<IntegrationsPageProps>(({ useAvailablePackages }) => {
  const { filteredCards, isLoading, searchTerm, setSearchTerm } = useAvailablePackages({
    prereleaseIntegrationsEnabled: true,
  });

  const tinyList = filteredCards.filter((card) => AVAILABLE_INTEGRATIONS.includes(card.name));

  const list: IntegrationCardItem[] = useIntegrationCardList({
    integrationsList: tinyList,
    // featuredCardIds: selectedTab.featuredCardIds,
  });

  const installed = list.filter(
    (card) =>
      card.installStatus === installationStatuses.Installed ||
      card.installStatus === installationStatuses.InstallFailed
  );

  const [viewSelected, setViewSelected] = useState<ViewFacet>('all');

  if (isLoading) {
    return (
      <EuiSkeletonText
        data-test-subj="loadingPackages"
        isLoading={true}
        lines={LOADING_SKELETON_TEXT_LINES}
      />
    );
  }
  return (
    <EuiFlexGroup>
      <EuiFlexItem
        css={css`
          max-width: 245px;
        `}
      >
        <EuiFacetGroup gutterSize="s">
          <EuiFacetButton
            id="integrationsAll"
            quantity={tinyList.length}
            isSelected={viewSelected === 'all'}
            data-test-subj={'integrationsAll'}
            onClick={() => setViewSelected('all')}
          >
            All integrations
          </EuiFacetButton>
          <EuiFacetButton
            id="integrationsInstalled"
            quantity={installed.length}
            isSelected={viewSelected === 'installed'}
            data-test-subj={'integrationsInstalled'}
            onClick={() => setViewSelected('installed')}
          >
            Installed integrations
          </EuiFacetButton>
        </EuiFacetGroup>
      </EuiFlexItem>
      <EuiFlexItem
        css={css`
          max-width: 1200px;
        `}
      >
        <PackageListGrid
          calloutTopSpacerSize="m"
          categories={[]} // We do not want to show categories and subcategories as the search bar filter
          emptyStateStyles={{ paddingTop: '16px' }}
          list={viewSelected === 'all' ? list : viewSelected === 'installed' ? installed : []}
          scrollElementId={'integrations-scroll-container'}
          searchTerm={searchTerm}
          selectedCategory={'security'}
          selectedSubCategory={''}
          setCategory={() => {}}
          setSearchTerm={setSearchTerm}
          setUrlandPushHistory={() => {}}
          setUrlandReplaceHistory={() => {}}
          showCardLabels={true}
          showControls={false}
          showSearchTools={true}
          sortByFeaturedIntegrations={false}
          spacer={false}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
});
IntegrationsPage.displayName = 'IntegrationsTabComponent';

export const IntegrationsView = withLazyHook(IntegrationsPage, () =>
  import('@kbn/fleet-plugin/public').then((module) => module.AvailablePackagesHook())
);
IntegrationsView.displayName = 'IntegrationsView';
