/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';

import type { OnboardingCardComponent } from '../../../../types';
import { OnboardingCardContentPanel } from '../common/card_content_panel';
import { IntegrationsCardGridTabsComponent } from '../common/integrations/integration_card_grid_tabs';
import { CenteredLoadingSpinner } from '../../../../../common/components/centered_loading_spinner';
import type { IntegrationCardMetadata } from '../common/integrations/types';
import { INTEGRATION_TABS } from './integration_tabs_configs';
import { IntegrationCardTopCalloutComponent } from '../common/integrations/callouts/integration_card_top_callout';
import {
  WithFilteredIntegrations,
  type RenderChildrenType,
} from '../common/integrations/use_filter_cards';
import { useSelectedTab } from '../common/integrations/use_selected_tab';
import { useOnboardingContext } from '../../../onboarding_context';
import { useIntegrationCardList } from '../common/integrations/use_integration_card_list';

export const DEFAULT_CHECK_COMPLETE_METADATA = {
  installedIntegrationsCount: 0,
  isAgentRequired: false,
};

export const IntegrationsCardGridTabs: RenderChildrenType = ({
  allowedIntegrations,
  availablePackagesResult,
  checkCompleteMetadata = DEFAULT_CHECK_COMPLETE_METADATA,
  selectedTabResult,
}) => {
  const list = useIntegrationCardList({
    integrationsList: allowedIntegrations,
    featuredCardIds: selectedTabResult.selectedTab?.featuredCardIds,
  });
  const { installedIntegrationsCount, isAgentRequired } = checkCompleteMetadata;
  return (
    <IntegrationsCardGridTabsComponent
      isAgentRequired={isAgentRequired}
      installedIntegrationsCount={installedIntegrationsCount}
      topCalloutRenderer={IntegrationCardTopCalloutComponent}
      integrationList={list}
      availablePackagesResult={availablePackagesResult}
      selectedTabResult={selectedTabResult}
    />
  );
};

export const IntegrationsCard: OnboardingCardComponent<IntegrationCardMetadata> = React.memo(
  ({ checkCompleteMetadata }) => {
    const { spaceId } = useOnboardingContext();

    const selectedTabResult = useSelectedTab({
      spaceId,
      integrationTabs: INTEGRATION_TABS,
    });
    if (!checkCompleteMetadata) {
      return <CenteredLoadingSpinner data-test-subj="loadingInstalledIntegrations" />;
    }

    return (
      <OnboardingCardContentPanel>
        <WithFilteredIntegrations
          renderChildren={IntegrationsCardGridTabs}
          prereleaseIntegrationsEnabled={false}
          checkCompleteMetadata={checkCompleteMetadata}
          selectedTabResult={selectedTabResult}
        />
      </OnboardingCardContentPanel>
    );
  }
);
IntegrationsCard.displayName = 'IntegrationsCard';

// eslint-disable-next-line import/no-default-export
export default IntegrationsCard;
