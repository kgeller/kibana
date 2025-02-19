/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getExistingEnvironmentsForService } from './get_environments/get_existing_environments_for_service';
import { listConfigurations } from './list_configurations';
import { searchConfigurations } from './search_configurations';
import type { SearchParamsMock } from '../../../utils/test_helpers';
import { inspectSearchParams } from '../../../utils/test_helpers';
import { findExactConfiguration } from './find_exact_configuration';
import { getAllEnvironments } from '../../environments/get_all_environments';

describe('agent configuration queries', () => {
  let mock: SearchParamsMock;

  afterEach(() => {
    mock.teardown();
  });

  describe('getAllEnvironments', () => {
    it('fetches all environments', async () => {
      mock = await inspectSearchParams(({ mockApmEventClient }) =>
        getAllEnvironments({
          searchAggregatedTransactions: false,
          serviceName: 'foo',
          apmEventClient: mockApmEventClient,
          size: 50,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });
  });

  describe('getExistingEnvironmentsForService', () => {
    it('fetches unavailable environments', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient }) =>
        getExistingEnvironmentsForService({
          serviceName: 'foo',
          internalESClient: mockInternalESClient,
          size: 50,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });
  });

  describe('listConfigurations', () => {
    it('fetches configurations', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient, mockIndices }) =>
        listConfigurations({
          internalESClient: mockInternalESClient,
          apmIndices: mockIndices,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });
  });

  describe('searchConfigurations', () => {
    it('fetches filtered configurations without an environment', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient }) =>
        searchConfigurations({
          service: {
            name: 'foo',
          },
          internalESClient: mockInternalESClient,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });

    it('fetches filtered configurations with an environment', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient }) =>
        searchConfigurations({
          service: {
            name: 'foo',
            environment: 'bar',
          },
          internalESClient: mockInternalESClient,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });
  });

  describe('findExactConfiguration', () => {
    it('find configuration by service.name', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient, mockApmEventClient }) =>
        findExactConfiguration({
          service: { name: 'foo' },
          internalESClient: mockInternalESClient,
          apmEventClient: mockApmEventClient,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });

    it('find configuration by service.environment', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient, mockApmEventClient }) =>
        findExactConfiguration({
          service: { environment: 'bar' },
          internalESClient: mockInternalESClient,
          apmEventClient: mockApmEventClient,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });

    it('find configuration by service.name and service.environment', async () => {
      mock = await inspectSearchParams(({ mockInternalESClient, mockApmEventClient }) =>
        findExactConfiguration({
          service: { name: 'foo', environment: 'bar' },
          internalESClient: mockInternalESClient,
          apmEventClient: mockApmEventClient,
        })
      );

      expect(mock.params).toMatchSnapshot();
    });
  });
});
