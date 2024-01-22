/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { ElasticsearchClient, Logger } from '@kbn/core/server';
import { NewPackagePolicy } from '@kbn/fleet-plugin/common';
import { putCriblRoutingPipeline } from './putCriblRoutingPipeline';
import { getRouteEntriesFromPolicyConfig } from '../../common/helpers/translator';

export const onPackagePolicyPostCreateOrUpdateCallback = async (
    esClient: ElasticsearchClient,
    packagePolicy: NewPackagePolicy,
    logger: Logger,
  ): Promise<void> => {
    const routeEntriesFromConfig = getRouteEntriesFromPolicyConfig(packagePolicy.vars);
    return await putCriblRoutingPipeline(esClient, routeEntriesFromConfig, logger);
  };