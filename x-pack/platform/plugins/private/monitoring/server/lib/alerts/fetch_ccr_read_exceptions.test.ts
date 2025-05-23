/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticsearchClientMock } from '@kbn/core-elasticsearch-client-server-mocks';
import { fetchCCRReadExceptions } from './fetch_ccr_read_exceptions';

jest.mock('../../static_globals', () => ({
  Globals: {
    app: {
      config: {
        ui: {
          ccs: { enabled: true },
        },
      },
    },
  },
}));
import { Globals } from '../../static_globals';

describe('fetchCCReadExceptions', () => {
  const esRes = {
    aggregations: {
      remote_clusters: {
        buckets: [],
      },
    },
  };

  it('should call ES with correct query', async () => {
    const esClient = elasticsearchClientMock.createScopedClusterClient().asCurrentUser;
    esClient.search.mockResponse(
      // @ts-expect-error not full response interface
      esRes
    );

    await fetchCCRReadExceptions(esClient, 1643306331418, 1643309869056, 10000);
    expect(esClient.search).toHaveBeenCalledWith({
      index:
        '*:.monitoring-es-*,.monitoring-es-*,*:metrics-elasticsearch.stack_monitoring.ccr-*,metrics-elasticsearch.stack_monitoring.ccr-*',
      filter_path: ['aggregations.remote_clusters.buckets'],
      size: 0,
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  {
                    nested: {
                      ignore_unmapped: true,
                      path: 'ccr_stats.read_exceptions',
                      query: {
                        exists: {
                          field: 'ccr_stats.read_exceptions.exception',
                        },
                      },
                    },
                  },
                  {
                    nested: {
                      ignore_unmapped: true,
                      path: 'elasticsearch.ccr.read_exceptions',
                      query: {
                        exists: {
                          field: 'elasticsearch.ccr.read_exceptions.exception',
                        },
                      },
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
            {
              bool: {
                should: [
                  { term: { type: 'ccr_stats' } },
                  { term: { 'metricset.name': 'ccr' } },
                  { term: { 'data_stream.dataset': 'elasticsearch.stack_monitoring.ccr' } },
                ],
                minimum_should_match: 1,
              },
            },
            {
              range: {
                timestamp: { format: 'epoch_millis', gte: 1643306331418, lte: 1643309869056 },
              },
            },
          ],
        },
      },
      aggs: {
        remote_clusters: {
          terms: { field: 'ccr_stats.remote_cluster', size: 10000 },
          aggs: {
            follower_indices: {
              terms: { field: 'ccr_stats.follower_index', size: 10000 },
              aggs: {
                hits: {
                  top_hits: {
                    sort: [{ timestamp: { order: 'desc', unmapped_type: 'long' } }],
                    _source: {
                      includes: [
                        'cluster_uuid',
                        'elasticsearch.cluster.id',
                        'ccr_stats.read_exceptions',
                        'elasticsearch.ccr.read_exceptions',
                        'ccr_stats.shard_id',
                        'elasticsearch.ccr.shard_id',
                        'ccr_stats.leader_index',
                        'elasticsearch.ccr.leader.index',
                      ],
                    },
                    size: 1,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('should call ES with correct query when ccs disabled', async () => {
    const esClient = elasticsearchClientMock.createScopedClusterClient().asCurrentUser;
    esClient.search.mockResponse(
      // @ts-expect-error not full response interface
      esRes
    );
    // @ts-ignore
    Globals.app.config.ui.ccs.enabled = false;
    let params = null;
    esClient.search.mockImplementation((...args) => {
      params = args[0];
      return Promise.resolve(esRes as any);
    });

    await fetchCCRReadExceptions(esClient, 1643306331418, 1643309869056, 10000);

    // @ts-ignore
    expect(params.index).toBe('.monitoring-es-*,metrics-elasticsearch.stack_monitoring.ccr-*');
  });

  it('should return read exceptions from legacy documents', async () => {
    const legacyRes = {
      aggregations: {
        remote_clusters: {
          buckets: [
            {
              key: 'secondary',
              doc_count: 21,
              follower_indices: {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [
                  {
                    key: 'foobar_follower',
                    doc_count: 21,
                    hits: {
                      hits: {
                        total: { value: 21, relation: 'eq' },
                        max_score: null,
                        hits: [
                          {
                            _index: '.monitoring-es-7-mb-2023.03.30',
                            _id: '0YmUM4cBxRuN6VWqFo3H',
                            _score: null,
                            _source: {
                              ccr_stats: {
                                shard_id: 0,
                                read_exceptions: [
                                  {
                                    retries: 1,
                                    exception: {
                                      reason:
                                        'java.lang.IllegalArgumentException: unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
                                      caused_by: {
                                        type: 'illegal_argument_exception',
                                        reason:
                                          'unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
                                        caused_by: {
                                          type: 'unknown_host_exception',
                                          reason: 'secondary.es.us-central1.gcp.cloud.es.ioe',
                                        },
                                      },
                                      type: 'exception',
                                    },
                                    from_seq_no: 28,
                                  },
                                ],
                                leader_index: 'foobar',
                              },
                              cluster_uuid: 'jRHXRb4pSnySw_JEBv_dHg',
                            },
                            sort: [1680197555160],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    };

    const esClient = elasticsearchClientMock.createScopedClusterClient().asCurrentUser;
    esClient.search.mockResponse(
      // @ts-expect-error not full response interface
      legacyRes
    );

    const result = await fetchCCRReadExceptions(esClient, 1643306331418, 1643309869056, 10000);
    expect(result).toStrictEqual([
      {
        clusterUuid: 'jRHXRb4pSnySw_JEBv_dHg',
        remoteCluster: 'secondary',
        followerIndex: 'foobar_follower',
        leaderIndex: 'foobar',
        shardId: 0,
        lastReadException: {
          type: 'exception',
          reason:
            'java.lang.IllegalArgumentException: unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
          caused_by: {
            type: 'illegal_argument_exception',
            reason: 'unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
            caused_by: {
              type: 'unknown_host_exception',
              reason: 'secondary.es.us-central1.gcp.cloud.es.ioe',
            },
          },
        },
        ccs: null,
      },
    ]);
  });

  it('should return read exceptions from ecs documents', async () => {
    const ecsRes = {
      aggregations: {
        remote_clusters: {
          buckets: [
            {
              key: 'secondary',
              doc_count: 44,
              follower_indices: {
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0,
                buckets: [
                  {
                    key: 'foobar_follower',
                    doc_count: 44,
                    hits: {
                      hits: {
                        total: { value: 44, relation: 'eq' },
                        max_score: null,
                        hits: [
                          {
                            _index: '.ds-.monitoring-es-8-mb-2023.03.30-000001',
                            _id: '6YmAM4cBxRuN6VWqx4Sg',
                            _score: null,
                            _source: {
                              elasticsearch: {
                                cluster: { id: 'jRHXRb4pSnySw_JEBv_dHg' },
                                ccr: {
                                  read_exceptions: [
                                    {
                                      from_seq_no: 28,
                                      retries: 1,
                                      exception: {
                                        type: 'exception',
                                        reason:
                                          'java.lang.IllegalArgumentException: unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
                                        caused_by: {
                                          type: 'illegal_argument_exception',
                                          reason:
                                            'unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
                                          caused_by: {
                                            type: 'unknown_host_exception',
                                            reason: 'secondary.es.us-central1.gcp.cloud.es.ioe',
                                          },
                                        },
                                      },
                                    },
                                  ],
                                  leader: { index: 'foobar' },
                                },
                              },
                            },
                            sort: [1680196289074],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    };

    const esClient = elasticsearchClientMock.createScopedClusterClient().asCurrentUser;
    esClient.search.mockResponse(
      // @ts-expect-error not full response interface
      ecsRes
    );

    const result = await fetchCCRReadExceptions(esClient, 1643306331418, 1643309869056, 10000);
    expect(result).toStrictEqual([
      {
        clusterUuid: 'jRHXRb4pSnySw_JEBv_dHg',
        remoteCluster: 'secondary',
        followerIndex: 'foobar_follower',
        leaderIndex: 'foobar',
        shardId: undefined,
        lastReadException: {
          type: 'exception',
          reason:
            'java.lang.IllegalArgumentException: unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
          caused_by: {
            type: 'illegal_argument_exception',
            reason: 'unknown host [secondary.es.us-central1.gcp.cloud.es.ioe]',
            caused_by: {
              type: 'unknown_host_exception',
              reason: 'secondary.es.us-central1.gcp.cloud.es.ioe',
            },
          },
        },
        ccs: null,
      },
    ]);
  });
});
