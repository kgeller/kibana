/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';

import type { OnboardingCardComponent } from '../../../../../types';
import { OnboardingCardContentPanel } from '../../common/card_content_panel';
import { IntegrationsCardGridTabsComponent } from '../../common/integrations/integration_card_grid_tabs';
import { CenteredLoadingSpinner } from '../../../../../../common/components/centered_loading_spinner';
import type { IntegrationCardMetadata } from '../../common/integrations/types';
import { INTEGRATION_TABS } from './integration_tabs_configs';
import { ManageIntegrationsCallout } from '../../common/integrations/callouts/manage_integrations_callout';
import {
  WithFilteredIntegrations,
  type RenderChildrenType,
} from '../../common/integrations/use_filter_cards';
import { useSelectedTab } from '../../common/integrations/use_selected_tab';
import { useOnboardingContext } from '../../../../onboarding_context';
import { useEnhancedIntegrationCards } from '../../../../../../common/lib/search_ai_lake/hooks';

const RenderChildren: RenderChildrenType = ({
  allowedIntegrations,
  useAvailablePackagesResult,
  checkCompleteMetadata,
  useSelectedTabResult,
}) => {
  const { available: list } = useEnhancedIntegrationCards(allowedIntegrations, {
    showInstallationStatus: true,
    showCompressedInstallationStatus: true,
  });
  const { installedIntegrationsCount, isAgentRequired } = checkCompleteMetadata;

  return (
    <IntegrationsCardGridTabsComponent
      isAgentRequired={isAgentRequired}
      installedIntegrationsCount={installedIntegrationsCount}
      integrationTabs={INTEGRATION_TABS}
      topCalloutRenderer={installedIntegrationsCount ? ManageIntegrationsCallout : undefined}
      integrationList={list}
      useAvailablePackagesResult={useAvailablePackagesResult}
      useSelectedTabResult={useSelectedTabResult}
      packageListGridOptions={{
        showCardLabels: true,
      }}
    />
  );
};

export const IntegrationsCard: OnboardingCardComponent<IntegrationCardMetadata> = React.memo(
  ({ checkCompleteMetadata }) => {
    const { spaceId } = useOnboardingContext();

    const useSelectedTabResult = useSelectedTab({
      spaceId,
      integrationTabs: INTEGRATION_TABS,
    });

    if (!checkCompleteMetadata) {
      return <CenteredLoadingSpinner data-test-subj="loadingInstalledIntegrations" />;
    }

    return (
      <OnboardingCardContentPanel>
        <WithFilteredIntegrations
          renderChildren={RenderChildren}
          prereleaseIntegrationsEnabled={true}
          checkCompleteMetadata={checkCompleteMetadata}
          useSelectedTabResult={useSelectedTabResult}
        />
      </OnboardingCardContentPanel>
    );
  }
);
IntegrationsCard.displayName = 'IntegrationsCard';

// eslint-disable-next-line import/no-default-export
export default IntegrationsCard;
