/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { transformError } from '@kbn/securitysolution-es-utils';
import type { ElasticsearchClient, Logger } from '@kbn/core/server';
import { IngestPutPipelineRequest } from '@elastic/elasticsearch/lib/api/types';

export const createOrUpdatePipeline = async (
  esClient: ElasticsearchClient,
  pipelineConf: IngestPutPipelineRequest,
  logger: Logger
) => {
  const pipelineId = pipelineConf.id;
  try {
    await esClient.ingest.putPipeline(pipelineConf);
    return true;
  } catch (e) {
    const error = transformError(e);
    logger.error(`Failed to put Cribl integration pipeline ${pipelineId}. error: ${error.message}`);
  }
  return false;
};
