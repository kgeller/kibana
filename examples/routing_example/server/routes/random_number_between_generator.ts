/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { schema } from '@kbn/config-schema';
import { IRouter } from '@kbn/core/server';
import { RANDOM_NUMBER_BETWEEN_ROUTE_PATH } from '../../common';

/**
 *
 * @param router Registers a get route that returns a random number between one and another number suplied by the user.
 */
export function registerGetRandomNumberBetweenRoute(router: IRouter) {
  router.get(
    {
      path: RANDOM_NUMBER_BETWEEN_ROUTE_PATH,
      security: {
        authz: {
          enabled: false,
          reason:
            'This route is opted out of authorization because it is only intended for test use',
        },
      },
      validate: {
        query: schema.object({
          max: schema.number({ defaultValue: 10 }),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          randomNumber: Math.random() * request.query.max,
        },
      });
    }
  );
}
