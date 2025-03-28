/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { DataStreamFlyoutWithContextProps } from './data_stream_flyout_with_context_types';
import { httpService } from '../../../../services/http';
import { notificationService } from '../../../../services/notification';
import { UiMetricService } from '../../../../services/ui_metric';
import { documentationService } from '../../../../services';
import { UIM_APP_NAME } from '../../../../../../common/constants/ui_metric';
import { setUiMetricService } from '../../../../services/api';
import { AppDependencies, IndexManagementAppContext } from '../../../..';
import { DataStreamDetailPanel } from './data_stream_detail_panel';

export const DataStreamFlyoutWithContext: React.FC<DataStreamFlyoutWithContextProps> = ({
  core,
  dependencies,
  datastreamName,
  onClose,
  usageCollection,
}) => {
  // this normally happens when the index management app is rendered
  // but if components are embedded elsewhere that setup is skipped, so we have to do it here
  // would do it in plugin.ts but that blows up the bundle size
  // can't do it in an effect because then the first http call fails as the instantiation happens after first render
  if (!httpService.httpClient) {
    httpService.setup(core.http);
    notificationService.setup(core.notifications);
  }
  documentationService.setup(core.docLinks);

  const uiMetricService = new UiMetricService(UIM_APP_NAME);
  setUiMetricService(uiMetricService);
  uiMetricService.setup(usageCollection);

  const newDependencies: AppDependencies = {
    ...dependencies,
    services: {
      ...(dependencies.services || {}),
      httpService,
      notificationService,
      uiMetricService,
    },
  };
  return (
    <IndexManagementAppContext core={core} dependencies={newDependencies}>
      <DataStreamDetailPanel dataStreamName={datastreamName} onClose={onClose} />
    </IndexManagementAppContext>
  );
};
