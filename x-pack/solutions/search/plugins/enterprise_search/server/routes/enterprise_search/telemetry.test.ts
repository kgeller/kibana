/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MockRouter, mockLogger, mockDependencies } from '../../__mocks__';

import { savedObjectsServiceMock } from '@kbn/core/server/mocks';

jest.mock('../../collectors/lib/telemetry', () => ({
  incrementUICounter: jest.fn(),
}));
import { incrementUICounter } from '../../collectors/lib/telemetry';

import { registerTelemetryRoute } from './telemetry';

/**
 * Since these route callbacks are so thin, these serve simply as integration tests
 * to ensure they're wired up to the collector functions correctly. Business logic
 * is tested more thoroughly in the collectors/telemetry tests.
 */
describe('Enterprise Search Telemetry API', () => {
  let mockRouter: MockRouter;
  const successResponse = { success: true };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = new MockRouter({
      method: 'put',
      path: '/internal/enterprise_search/stats',
    });

    registerTelemetryRoute({
      ...mockDependencies,
      router: mockRouter.router,
      getSavedObjectsService: () => savedObjectsServiceMock.createStartContract(),
      log: mockLogger,
    });
  });

  describe('PUT /internal/enterprise_search/stats', () => {
    it('increments the saved objects counter for Enterprise Search', async () => {
      (incrementUICounter as jest.Mock).mockImplementation(jest.fn(() => successResponse));

      await mockRouter.callRoute({
        body: {
          product: 'enterprise_search',
          action: 'viewed',
          metric: 'setup_guide',
        },
      });

      expect(incrementUICounter).toHaveBeenCalledWith({
        id: 'enterprise_search_telemetry',
        savedObjects: expect.any(Object),
        uiAction: 'ui_viewed',
        metric: 'setup_guide',
      });
      expect(mockRouter.response.ok).toHaveBeenCalledWith({ body: successResponse });
    });

    it('throws an error when incrementing fails', async () => {
      (incrementUICounter as jest.Mock).mockImplementation(jest.fn(() => Promise.reject('Failed')));

      await expect(
        mockRouter.callRoute({
          body: {
            product: 'enterprise_search',
            action: 'error',
            metric: 'error',
          },
        })
      ).rejects.toEqual('Failed');

      expect(incrementUICounter).toHaveBeenCalled();
    });

    it('throws an error if the Saved Objects service is unavailable', async () => {
      jest.clearAllMocks();
      registerTelemetryRoute({
        router: mockRouter.router,
        getSavedObjectsService: null,
        log: mockLogger,
      } as any);
      await expect(mockRouter.callRoute({})).rejects.toThrow();

      expect(incrementUICounter).not.toHaveBeenCalled();
    });

    describe('validates', () => {
      it('correctly', () => {
        const request = {
          body: { product: 'enterprise_search', action: 'viewed', metric: 'setup_guide' },
        };
        mockRouter.shouldValidate(request);
      });

      it('wrong product string', () => {
        const request = {
          body: { product: 'enterprise_space_search', action: 'viewed', metric: 'setup_guide' },
        };
        mockRouter.shouldThrow(request);
      });

      it('wrong action string', () => {
        const request = {
          body: { product: 'enterprise_search', action: 'invalid', metric: 'setup_guide' },
        };
        mockRouter.shouldThrow(request);
      });

      it('wrong metric type', () => {
        const request = { body: { product: 'enterprise_search', action: 'clicked', metric: true } };
        mockRouter.shouldThrow(request);
      });

      it('product is missing string', () => {
        const request = { body: { action: 'viewed', metric: 'setup_guide' } };
        mockRouter.shouldThrow(request);
      });

      it('action is missing', () => {
        const request = { body: { product: 'enterprise_search', metric: 'setup_guide' } };
        mockRouter.shouldThrow(request);
      });

      it('metric is missing', () => {
        const request = { body: { product: 'enterprise_search', action: 'error' } };
        mockRouter.shouldThrow(request);
      });
    });
  });
});
