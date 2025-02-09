/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { lazy } from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import type { ESQLRow } from '@kbn/es-types';
import type { AggregateQuery } from '@kbn/es-query';
import { withSuspense } from '@kbn/shared-ux-utility';
import useAsync from 'react-use/lib/useAsync';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { DatatableColumn } from '@kbn/expressions-plugin/common';
import { CellActionsProvider } from '@kbn/cell-actions';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { untilPluginStartServicesReady } from './kibana_services';

interface ESQLDataGridProps {
  rows: ESQLRow[];
  dataView: DataView;
  columns: DatatableColumn[];
  query: AggregateQuery;
  /**
   * Optional parameters
   */
  flyoutType?: 'overlay' | 'push';
  isTableView?: boolean;
  initialColumns?: DatatableColumn[];
  fullHeight?: boolean;
  initialRowHeight?: number;
  controlColumnIds?: string[]; // default: ['openDetails', 'select']
}

const DataGridLazy = withSuspense(lazy(() => import('./data_grid')));

export const ESQLDataGrid = (props: ESQLDataGridProps) => {
  const { loading, value } = useAsync(() => {
    const startServicesPromise = untilPluginStartServicesReady();
    return Promise.all([startServicesPromise]);
  }, []);

  const getWrapper = (children: JSX.Element) => {
    return props.fullHeight ? <div css={{ height: 500 }}>{children}</div> : <>{children}</>;
  };

  const deps = value?.[0];
  if (loading || !deps) return <EuiLoadingSpinner />;

  return (
    <KibanaContextProvider
      services={{
        ...deps,
      }}
    >
      <CellActionsProvider getTriggerCompatibleActions={deps.uiActions.getTriggerCompatibleActions}>
        {getWrapper(
          <DataGridLazy
            data={deps.data}
            fieldFormats={deps.fieldFormats}
            core={deps.core}
            share={deps.share}
            {...props}
          />
        )}
      </CellActionsProvider>
    </KibanaContextProvider>
  );
};
