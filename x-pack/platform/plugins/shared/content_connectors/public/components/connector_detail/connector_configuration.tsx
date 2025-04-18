/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';

import { useActions, useValues } from 'kea';

import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSkeletonLoading,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';

import { ConnectorConfigurationComponent, ConnectorStatus } from '@kbn/search-connectors';

import { useKibana } from '@kbn/kibana-react-plugin/public';
import { hasNonEmptyAdvancedSnippet } from '../../utils/connector_helpers';

import { ConnectorFilteringLogic } from '../search_index/connector/sync_rules/connector_filtering_logic';

import { IndexViewLogic } from '../search_index/index_view_logic';

import { AttachIndexBox } from './attach_index_box';
import { AdvancedConfigOverrideCallout } from './components/advanced_config_override_callout';
import { ConfigurationSkeleton } from './components/configuration_skeleton';
import { WhatsNextBox } from './components/whats_next_box';
import { ConnectorViewLogic } from './connector_view_logic';
import { ConnectorDeployment } from './deployment';
import { NativeConnectorConfiguration } from './native_connector_configuration';
import { Status } from '../../../common/types/api';
import { useAppContext } from '../../app_context';
import { docLinks } from '../shared/doc_links';

export const ConnectorConfiguration: React.FC = () => {
  const {
    services: { http },
  } = useKibana();
  const { connector, updateConnectorConfigurationStatus } = useValues(ConnectorViewLogic({ http }));
  const { connectorTypes: connectors, hasPlatinumLicense } = useAppContext();
  const { isSyncing, isWaitingForSync } = useValues(IndexViewLogic({ http }));
  const { advancedSnippet } = useValues(ConnectorFilteringLogic({ http }));

  const NATIVE_CONNECTORS = useMemo(
    () => connectors.filter(({ isNative }) => isNative),
    [connectors]
  );

  // TODO service_type === "" is considered unknown/custom connector multiple places replace all of them with a better solution
  const CUSTOM_CONNECTOR = useMemo(
    () => connectors.filter(({ serviceType }) => serviceType === ''),
    [connectors]
  );

  const { updateConnectorConfiguration } = useActions(ConnectorViewLogic({ http }));

  if (!connector) {
    return <></>;
  }

  if (connector.is_native && connector.service_type) {
    return <NativeConnectorConfiguration />;
  }

  const isWaitingForConnector = !connector.status || connector.status === ConnectorStatus.CREATED;

  const nativeConnector =
    NATIVE_CONNECTORS.find(
      (connectorDefinition) => connectorDefinition.serviceType === connector.service_type
    ) || CUSTOM_CONNECTOR[0];

  const iconPath = nativeConnector.iconPath;

  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="m" direction="row" alignItems="center">
            {iconPath && (
              <EuiFlexItem grow={false}>
                <EuiIcon size="xl" type={iconPath} />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <EuiTitle size="s">
                <h2>{nativeConnector?.name ?? connector.name}</h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {connector.is_native
                  ? i18n.translate(
                      'xpack.contentConnectors.connector_detail.configurationConnector.badgeType.nativeConnector',
                      { defaultMessage: 'Elastic managed connector' }
                    )
                  : i18n.translate(
                      'xpack.contentConnectors.connector_detail.configurationConnector.badgeType.connectorClient',
                      { defaultMessage: 'Self-managed connector' }
                    )}
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="l" />
          <AttachIndexBox connector={connector} />
          <EuiSpacer />
          {connector.index_name && (
            <>
              <ConnectorDeployment />
              <EuiSpacer />
              <EuiPanel hasShadow={false} hasBorder>
                <EuiTitle size="s">
                  <h3>
                    {i18n.translate(
                      'xpack.contentConnectors.connector_detail.configurationConnector.configuration.title',
                      { defaultMessage: 'Configuration' }
                    )}
                  </h3>
                </EuiTitle>
                <EuiSpacer />
                <EuiSkeletonLoading
                  isLoading={isWaitingForConnector}
                  loadingContent={<ConfigurationSkeleton />}
                  loadedContent={
                    <ConnectorConfigurationComponent
                      connector={connector}
                      hasPlatinumLicense={hasPlatinumLicense}
                      isLoading={updateConnectorConfigurationStatus === Status.LOADING}
                      saveConfig={(configuration) =>
                        updateConnectorConfiguration({
                          configuration,
                          connectorId: connector.id,
                          http,
                        })
                      }
                      subscriptionLink={docLinks.licenseManagement}
                      stackManagementLink={http?.basePath.prepend(
                        '/app/management/stack/license_management'
                      )}
                    >
                      <EuiSpacer size="s" />
                      {hasNonEmptyAdvancedSnippet(connector, advancedSnippet) && (
                        <AdvancedConfigOverrideCallout />
                      )}
                    </ConnectorConfigurationComponent>
                  }
                />
              </EuiPanel>
              <EuiSpacer />
              <WhatsNextBox
                connectorId={connector.id}
                disabled={isWaitingForConnector || !connector.last_synced}
                isWaitingForConnector={isWaitingForConnector}
                connectorIndex={connector.index_name}
                connectorStatus={connector.status}
                isSyncing={Boolean(isSyncing || isWaitingForSync)}
              />
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
