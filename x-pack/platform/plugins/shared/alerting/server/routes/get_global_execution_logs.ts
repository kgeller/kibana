/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import { schema } from '@kbn/config-schema';
import type { ILicenseState } from '../lib';
import type { GetGlobalExecutionLogParams } from '../rules_client';
import type { RewriteRequestCase } from './lib';
import { verifyAccessAndContext, rewriteNamespaces } from './lib';
import type { AlertingRequestHandlerContext } from '../types';
import { INTERNAL_BASE_ALERTING_API_PATH } from '../types';
import { DEFAULT_ALERTING_ROUTE_SECURITY } from './constants';

const sortOrderSchema = schema.oneOf([schema.literal('asc'), schema.literal('desc')]);

const sortFieldSchema = schema.oneOf([
  schema.object({ timestamp: schema.object({ order: sortOrderSchema }) }),
  schema.object({ execution_duration: schema.object({ order: sortOrderSchema }) }),
  schema.object({ total_search_duration: schema.object({ order: sortOrderSchema }) }),
  schema.object({ es_search_duration: schema.object({ order: sortOrderSchema }) }),
  schema.object({ schedule_delay: schema.object({ order: sortOrderSchema }) }),
  schema.object({ num_triggered_actions: schema.object({ order: sortOrderSchema }) }),
  schema.object({ num_generated_actions: schema.object({ order: sortOrderSchema }) }),
  schema.object({ num_active_alerts: schema.object({ order: sortOrderSchema }) }),
  schema.object({ num_recovered_alerts: schema.object({ order: sortOrderSchema }) }),
  schema.object({ num_new_alerts: schema.object({ order: sortOrderSchema }) }),
]);

const sortFieldsSchema = schema.arrayOf(sortFieldSchema, {
  defaultValue: [{ timestamp: { order: 'desc' } }],
});

const querySchema = schema.object({
  date_start: schema.string(),
  date_end: schema.maybe(schema.string()),
  filter: schema.maybe(schema.string()),
  per_page: schema.number({ defaultValue: 10, min: 1 }),
  page: schema.number({ defaultValue: 1, min: 1 }),
  sort: sortFieldsSchema,
  namespaces: schema.maybe(schema.arrayOf(schema.string())),
});

const rewriteReq: RewriteRequestCase<GetGlobalExecutionLogParams> = ({
  date_start: dateStart,
  date_end: dateEnd,
  per_page: perPage,
  namespaces,
  ...rest
}) => ({
  ...rest,
  namespaces: rewriteNamespaces(namespaces),
  dateStart,
  dateEnd,
  perPage,
});

export const getGlobalExecutionLogRoute = (
  router: IRouter<AlertingRequestHandlerContext>,
  licenseState: ILicenseState
) => {
  router.get(
    {
      path: `${INTERNAL_BASE_ALERTING_API_PATH}/_global_execution_logs`,
      security: DEFAULT_ALERTING_ROUTE_SECURITY,
      options: {
        access: 'internal',
      },
      validate: {
        query: querySchema,
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const alertingContext = await context.alerting;
        const rulesClient = await alertingContext.getRulesClient();
        return res.ok({
          body: await rulesClient.getGlobalExecutionLogWithAuth(rewriteReq(req.query)),
        });
      })
    )
  );
};
