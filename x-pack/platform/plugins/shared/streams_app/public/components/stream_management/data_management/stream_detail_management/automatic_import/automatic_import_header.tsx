/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiBadge, EuiToolTip } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { useKibana } from '../../../../../hooks/use_kibana';
import type { StreamHeaderBadge, StreamHeaderMenuItem } from '../wrapper';
import {
  AUTOMATIC_IMPORT_APP_ID,
  useAutomaticImportOwnership,
} from './use_automatic_import_ownership';

/**
 * Automatic Import's part of a classic stream's page header, for a stream that belongs to an
 * Automatic Import integration: an information badge, and a menu item to manage the integration.
 */
export const useAutomaticImportHeader = (
  streamName: string
): { badges: StreamHeaderBadge[]; menuItems: StreamHeaderMenuItem[] } => {
  const {
    core: { application },
  } = useKibana();
  const ownership = useAutomaticImportOwnership(streamName);

  if (!ownership?.integrationId) {
    return { badges: [], menuItems: [] };
  }

  const { integrationId, packageName } = ownership;
  const name = packageName ?? integrationId;
  const label = i18n.translate('xpack.streams.automaticImport.integrationBadge', {
    defaultMessage: '{name} integration',
    values: { name },
  });

  return {
    badges: [
      {
        label,
        node: (
          <EuiToolTip
            position="top"
            title={i18n.translate('xpack.streams.automaticImport.builtWithTitle', {
              defaultMessage: 'Built with Automatic Import',
            })}
            content={i18n.translate('xpack.streams.automaticImport.badgeTooltip', {
              defaultMessage:
                'The {name} integration, built with Automatic Import, parses this stream.',
              values: { name },
            })}
            anchorProps={{
              css: css`
                display: inline-flex;
              `,
            }}
          >
            <EuiBadge
              color="hollow"
              iconType="package"
              tabIndex={0}
              data-test-subj="streamsAppAutomaticImportBadge"
            >
              {label}
            </EuiBadge>
          </EuiToolTip>
        ),
      },
    ],
    menuItems: [
      {
        id: 'automaticImportManage',
        label: i18n.translate('xpack.streams.automaticImport.manageIntegration', {
          defaultMessage: 'Manage integration',
        }),
        iconType: 'package',
        overflow: true,
        order: 0,
        href: application.getUrlForApp(AUTOMATIC_IMPORT_APP_ID, {
          path: `/edit/${integrationId}`,
        }),
        testId: 'streamsAppAutomaticImportManageIntegration',
      },
    ],
  };
};
