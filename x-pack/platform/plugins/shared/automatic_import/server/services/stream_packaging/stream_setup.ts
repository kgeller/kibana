/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from '@kbn/core/server';

const isNotFound = (error: unknown): boolean =>
  (error as { meta?: { statusCode?: number } })?.meta?.statusCode === 404;

/** Returns the package that owns a data stream, from the `_meta` its template gave it. */
export const getOwningPackageName = async (
  esClient: ElasticsearchClient,
  streamName: string
): Promise<string | undefined> => {
  try {
    const result = await esClient.indices.getDataStream({ name: streamName });
    const meta = result.data_streams[0]?._meta as { package?: { name?: string } } | undefined;
    return meta?.package?.name;
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
};

/** Returns the dataset part of a package data stream name, `logs-<pkg>.<dataset>-<namespace>`. */
export const getPackageDataset = (streamName: string, packageName: string): string | undefined => {
  const match = streamName.match(/^[^-]+-(.+)-[^-]+$/);
  const dataset = match?.[1];
  const prefix = `${packageName}.`;
  return dataset?.startsWith(prefix) ? dataset.slice(prefix.length) : undefined;
};
