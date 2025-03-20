/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlexItem, EuiSpacer, EuiBadge } from '@elastic/eui';
import type { IntegrationCardItem } from '@kbn/fleet-plugin/public';
import { SECURITY_UI_APP_ID } from '@kbn/security-solution-navigation';
import { useNavigation } from '../../common/lib/kibana';
import type { GetAppUrl, NavigateTo } from '../../common/lib/kibana';
import { APP_INTEGRATIONS_PATH, APP_UI_ID, CONFIGURATIONS_PATH } from '../../../common/constants';
import { INTEGRATION_APP_ID } from '../../onboarding/components/onboarding_body/cards/integrations/constants';

export const useIntegrationCardList = ({
  integrationsList,
}: {
  integrationsList: IntegrationCardItem[];
  featuredCardIds?: string[] | undefined;
}): IntegrationCardItem[] => {
  const { navigateTo, getAppUrl } = useNavigation();

  const { integrationCards } = useMemo(
    () => getFilteredCards({ navigateTo, getAppUrl, integrationsList }),
    [navigateTo, getAppUrl, integrationsList]
  );

  return integrationCards ?? [];
};

const getFilteredCards = ({
  getAppUrl,
  installedIntegrationList,
  integrationsList,
  navigateTo,
}: {
  getAppUrl: GetAppUrl;
  installedIntegrationList?: IntegrationCardItem[];
  integrationsList: IntegrationCardItem[];
  navigateTo: NavigateTo;
}) => {
  const securityIntegrationsList = integrationsList.map((card) =>
    addSecuritySpecificProps({ navigateTo, getAppUrl, card, installedIntegrationList })
  );

  return {
    integrationCards: securityIntegrationsList,
  };
};

const ONBOARDING_LINK = 'onboardingLink';
const ONBOARDING_APP_ID = 'onboardingAppId';

const addPathParamToUrl = (url: string, onboardingLink: string) => {
  const encoded = encodeURIComponent(onboardingLink);
  const paramsString = `${ONBOARDING_LINK}=${encoded}&${ONBOARDING_APP_ID}=${APP_UI_ID}`;

  if (url.indexOf('?') >= 0) {
    return `${url}&${paramsString}`;
  }
  return `${url}?${paramsString}`;
};

const addSecuritySpecificProps = ({
  navigateTo,
  getAppUrl,
  card,
}: {
  navigateTo: NavigateTo;
  getAppUrl: GetAppUrl;
  card: IntegrationCardItem;
  installedIntegrationList?: IntegrationCardItem[];
}): IntegrationCardItem => {
  const configurationsIntegrationsLink = getAppUrl({
    appId: SECURITY_UI_APP_ID,
    path: CONFIGURATIONS_PATH,
  });
  const integrationRootUrl = getAppUrl({ appId: INTEGRATION_APP_ID });
  const state = {
    onCancelNavigateTo: [APP_UI_ID, { path: CONFIGURATIONS_PATH }],
    onCancelUrl: CONFIGURATIONS_PATH,
    onSaveNavigateTo: [APP_UI_ID, { path: CONFIGURATIONS_PATH }],
  };
  const url = addPathParamToUrl(card.url, configurationsIntegrationsLink);
  const categoryBadgeText = card.categories.includes('edr_xdr')
    ? 'EDR/XDR'
    : card.categories.includes('siem')
    ? 'SIEM'
    : '';
  return {
    ...card,
    url,
    showDescription: false,
    showReleaseBadge: false,
    extraLabelsBadges: [
      <EuiFlexItem grow={false}>
        <EuiSpacer size="xs" />
        <span>
          <EuiBadge color="hollow">{categoryBadgeText}</EuiBadge>
        </span>
      </EuiFlexItem>,
    ] as React.ReactNode[],
    maxCardHeight: 88,
    onCardClick: () => {
      if (url.startsWith(APP_INTEGRATIONS_PATH)) {
        console.log('a');
        navigateTo({
          appId: INTEGRATION_APP_ID,
          path: url.slice(integrationRootUrl.length),
          state,
        });
      } else if (url.startsWith('http') || url.startsWith('https')) {
        console.log('b');
        window.open(url, '_blank');
      } else {
        console.log('c');
        navigateTo({ url, state });
      }
    },
  };
};
