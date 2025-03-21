/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ProcessorEvent } from '@kbn/observability-plugin/common';
import { termQuery, kqlQuery, rangeQuery } from '@kbn/observability-plugin/server';
import {
  getTotalIndicesStats,
  getEstimatedSizeForDocumentsInIndex,
  getApmDiskSpacedUsedPct,
} from './indices_stats_helpers';
import type { ApmPluginRequestHandlerContext } from '../typings';
import {
  IndexLifecyclePhaseSelectOption,
  indexLifeCyclePhaseToDataTier,
} from '../../../common/storage_explorer_types';
import type { RandomSampler } from '../../lib/helpers/get_random_sampler';
import { SERVICE_NAME, TIER, INDEX } from '../../../common/es_fields/apm';
import { environmentQuery } from '../../../common/utils/environment_query';
import {
  getBackwardCompatibleDocumentTypeFilter,
  getProcessorEventForTransactions,
  getDurationFieldForTransactions,
  isRootTransaction,
} from '../../lib/helpers/transactions';
import { calculateThroughputWithRange } from '../../lib/helpers/calculate_throughput';
import type { APMEventClient } from '../../lib/helpers/create_es_client/create_apm_event_client';

interface SharedOptions {
  apmEventClient: APMEventClient;
  indexLifecyclePhase: IndexLifecyclePhaseSelectOption;
  start: number;
  end: number;
  environment: string;
  kuery: string;
}

type TracesPerMinuteOptions = SharedOptions & {
  searchAggregatedTransactions: boolean;
};

async function getTracesPerMinute({
  apmEventClient,
  indexLifecyclePhase,
  start,
  end,
  environment,
  kuery,
  searchAggregatedTransactions,
}: TracesPerMinuteOptions) {
  const response = await apmEventClient.search('get_traces_per_minute', {
    apm: {
      events: [getProcessorEventForTransactions(searchAggregatedTransactions)],
    },
    size: 0,
    track_total_hits: false,
    query: {
      bool: {
        filter: [
          ...getBackwardCompatibleDocumentTypeFilter(searchAggregatedTransactions),
          ...environmentQuery(environment),
          ...kqlQuery(kuery),
          ...rangeQuery(start, end),
          ...(indexLifecyclePhase !== IndexLifecyclePhaseSelectOption.All
            ? termQuery(TIER, indexLifeCyclePhaseToDataTier[indexLifecyclePhase])
            : []),
          isRootTransaction(searchAggregatedTransactions),
        ],
      },
    },
    aggs: {
      traces_count: {
        value_count: {
          field: getDurationFieldForTransactions(searchAggregatedTransactions),
        },
      },
    },
  });

  return calculateThroughputWithRange({
    start,
    end,
    value: response?.aggregations?.traces_count.value ?? 0,
  });
}

type MainSummaryStatsOptions = SharedOptions & {
  context: ApmPluginRequestHandlerContext;
  indexLifecyclePhase: IndexLifecyclePhaseSelectOption;
  randomSampler: RandomSampler;
};

async function getMainSummaryStats({
  apmEventClient,
  context,
  indexLifecyclePhase,
  randomSampler,
  start,
  end,
  environment,
  kuery,
}: MainSummaryStatsOptions) {
  const [totalIndicesStats, totalDiskSpace, res] = await Promise.all([
    getTotalIndicesStats({ context, apmEventClient }),
    getApmDiskSpacedUsedPct(context),
    apmEventClient.search('get_storage_explorer_main_summary_stats', {
      apm: {
        events: [
          ProcessorEvent.span,
          ProcessorEvent.transaction,
          ProcessorEvent.error,
          ProcessorEvent.metric,
        ],
      },
      size: 0,
      track_total_hits: false,
      query: {
        bool: {
          filter: [
            ...environmentQuery(environment),
            ...kqlQuery(kuery),
            ...rangeQuery(start, end),
            ...(indexLifecyclePhase !== IndexLifecyclePhaseSelectOption.All
              ? termQuery(TIER, indexLifeCyclePhaseToDataTier[indexLifecyclePhase])
              : []),
          ],
        },
      },
      aggs: {
        services_count: {
          cardinality: {
            field: SERVICE_NAME,
          },
        },
        sample: {
          random_sampler: randomSampler,
          aggs: {
            indices: {
              terms: {
                field: INDEX,
                size: 500,
              },
              aggs: {
                number_of_metric_docs: {
                  value_count: {
                    field: INDEX,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const { indices: allIndicesStats } = totalIndicesStats;
  const estimatedIncrementalSize = allIndicesStats
    ? res.aggregations?.sample.indices.buckets.reduce((prev, curr) => {
        return (
          prev +
          getEstimatedSizeForDocumentsInIndex({
            allIndicesStats,
            indexName: curr.key as string,
            numberOfDocs: curr.number_of_metric_docs.value,
          })
        );
      }, 0) ?? 0
    : 0;

  const durationAsDays = (end - start) / 1000 / 60 / 60 / 24;
  const totalApmSize = totalIndicesStats._all.total?.store?.size_in_bytes ?? 0;

  return {
    totalSize: totalApmSize,
    diskSpaceUsedPct: totalApmSize / totalDiskSpace,
    numberOfServices: res.aggregations?.services_count.value ?? 0,
    estimatedIncrementalSize,
    dailyDataGeneration: estimatedIncrementalSize / durationAsDays,
  };
}

export interface StorageExplorerSummaryStatisticsResponse {
  tracesPerMinute: number;
  totalSize: number;
  diskSpaceUsedPct: number;
  numberOfServices: number;
  estimatedIncrementalSize: number;
  dailyDataGeneration: number;
}

export async function getSummaryStatistics({
  apmEventClient,
  context,
  start,
  end,
  environment,
  kuery,
  randomSampler,
  indexLifecyclePhase,
  searchAggregatedTransactions,
}: TracesPerMinuteOptions &
  MainSummaryStatsOptions): Promise<StorageExplorerSummaryStatisticsResponse> {
  const [mainSummaryStats, tracesPerMinute] = await Promise.all([
    getMainSummaryStats({
      apmEventClient,
      context,
      indexLifecyclePhase,
      randomSampler,
      start,
      end,
      environment,
      kuery,
    }),
    getTracesPerMinute({
      apmEventClient,
      indexLifecyclePhase,
      start,
      end,
      environment,
      kuery,
      searchAggregatedTransactions,
    }),
  ]);

  return {
    ...mainSummaryStats,
    tracesPerMinute,
  };
}
