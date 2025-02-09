/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpStart } from '@kbn/core/public';
import { DataStreamDocsStat, NonAggregatableDatasets } from '../../../common/api_types';
import {
  DataStreamStatServiceResponse,
  GetDataStreamsDegradedDocsStatsQuery,
  GetDataStreamsFailedDocsStatsQuery,
  GetDataStreamsStatsQuery,
  GetDataStreamsTotalDocsQuery,
  GetNonAggregatableDataStreamsParams,
} from '../../../common/data_streams_stats';
import { Integration } from '../../../common/data_streams_stats/integration';

export type DataStreamsStatsServiceSetup = void;

export interface DataStreamsStatsServiceStart {
  getClient: () => Promise<IDataStreamsStatsClient>;
}

export interface DataStreamsStatsServiceStartDeps {
  http: HttpStart;
}

export interface IDataStreamsStatsClient {
  getDataStreamsStats(params?: GetDataStreamsStatsQuery): Promise<DataStreamStatServiceResponse>;
  getDataStreamsDegradedStats(
    params?: GetDataStreamsDegradedDocsStatsQuery
  ): Promise<DataStreamDocsStat[]>;
  getDataStreamsFailedStats(
    params?: GetDataStreamsFailedDocsStatsQuery
  ): Promise<DataStreamDocsStat[]>;
  getDataStreamsTotalDocs(params: GetDataStreamsTotalDocsQuery): Promise<DataStreamDocsStat[]>;
  getIntegrations(): Promise<Integration[]>;
  getNonAggregatableDatasets(
    params: GetNonAggregatableDataStreamsParams
  ): Promise<NonAggregatableDatasets>;
}
