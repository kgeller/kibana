/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  IngestPutPipelineRequest,
  IngestProcessorContainer,
} from '@elastic/elasticsearch/lib/api/types';
import type { ElasticsearchClient, Logger } from '@kbn/core/server';
import { createOrUpdatePipeline } from '../common/createOrUpdatePipeline';
import { RouteEntry } from '../../common/types';
import { INTEGRATIONS_CRIBL_ROUTING_PIPELINE } from '../../common/constants';

export const putCriblRoutingPipeline = async (
  esClient: ElasticsearchClient,
  mappings: RouteEntry[],
  logger: Logger
) => {
  const pipelineConf = buildPipelineConfiguration(mappings);
  const pipelineResult = await createOrUpdatePipeline(esClient, pipelineConf, logger);
  console.log(pipelineResult);
};

const buildPipelineConfiguration = (mappings: RouteEntry[]): IngestPutPipelineRequest => {
  return {
    id: INTEGRATIONS_CRIBL_ROUTING_PIPELINE,
    _meta: {
      "managed": true,
    },
    description: 'Pipeline for routing events from Cribl',
    processors: buildCriblRoutingProcessors(mappings),
    on_failure: [
      {
        set: {
          field: 'error.message',
          value: '{{ _ingest.on_failure_message }}',
        },
      },
    ],
  };
}

const buildCriblRoutingProcessors = (mappings: RouteEntry[]): IngestProcessorContainer[] => {
  let processors: IngestProcessorContainer[] = [];

  mappings.forEach(function (mapping) {
    processors.push({
      // TODO update this to use reroute processor once available
      set: {
        field: 'criblId',
        value: mapping.criblSourceId,
      },
    });
  });

  return processors;
}
