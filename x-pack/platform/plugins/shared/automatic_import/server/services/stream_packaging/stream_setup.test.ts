/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticsearchServiceMock } from '@kbn/core/server/mocks';
import { getOwningPackageName, getPackageDataset } from './stream_setup';

describe('stream_setup', () => {
  it('reads the owning package from the data stream, and treats a missing stream as unowned', async () => {
    const esClient = elasticsearchServiceMock.createElasticsearchClient();
    esClient.indices.getDataStream.mockResolvedValueOnce({
      data_streams: [{ _meta: { package: { name: 'myapp' } } }],
    } as never);
    expect(await getOwningPackageName(esClient, 'logs-myapp.logs-default')).toBe('myapp');

    esClient.indices.getDataStream.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { meta: { statusCode: 404 } })
    );
    expect(await getOwningPackageName(esClient, 'logs-none-default')).toBeUndefined();
  });

  it('parses package datasets', () => {
    expect(getPackageDataset('logs-myapp_pkg.logs-default', 'myapp_pkg')).toBe('logs');
    expect(getPackageDataset('logs-nginx.access-default', 'myapp_pkg')).toBeUndefined();
  });
});
