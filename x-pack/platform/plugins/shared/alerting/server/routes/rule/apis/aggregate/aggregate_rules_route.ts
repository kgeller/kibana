/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import type { UsageCounter } from '@kbn/usage-collection-plugin/server';

import { defaultRuleAggregationFactoryV1 } from '../../../../application/rule/methods/aggregate';
import type { ILicenseState } from '../../../../lib';
import { verifyAccessAndContext } from '../../../lib';
import type { AlertingRequestHandlerContext } from '../../../../types';
import { INTERNAL_BASE_ALERTING_API_PATH } from '../../../../types';
import { trackLegacyTerminology } from '../../../lib/track_legacy_terminology';
import type {
  AggregateRulesRequestBodyV1,
  AggregateRulesResponseV1,
} from '../../../../../common/routes/rule/apis/aggregate';
import { aggregateRulesRequestBodySchemaV1 } from '../../../../../common/routes/rule/apis/aggregate';
import { formatDefaultAggregationResult } from './transforms';
import { transformAggregateQueryRequestV1, transformAggregateBodyResponseV1 } from './transforms';
import type { DefaultRuleAggregationResult } from './types';
import { DEFAULT_ALERTING_ROUTE_SECURITY } from '../../../constants';

export const aggregateRulesRoute = (
  router: IRouter<AlertingRequestHandlerContext>,
  licenseState: ILicenseState,
  usageCounter?: UsageCounter
) => {
  router.post(
    {
      path: `${INTERNAL_BASE_ALERTING_API_PATH}/rules/_aggregate`,
      security: DEFAULT_ALERTING_ROUTE_SECURITY,
      options: { access: 'internal' },
      validate: {
        body: aggregateRulesRequestBodySchemaV1,
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const alertingContext = await context.alerting;
        const rulesClient = await alertingContext.getRulesClient();
        const body: AggregateRulesRequestBodyV1 = req.body;
        const options = transformAggregateQueryRequestV1({
          ...body,
          has_reference: body.has_reference || undefined,
        });
        trackLegacyTerminology(
          [body.search, body.search_fields].filter(Boolean) as string[],
          usageCounter
        );

        const aggregateResult = await rulesClient.aggregate<DefaultRuleAggregationResult>({
          aggs: defaultRuleAggregationFactoryV1(),
          options,
        });

        const responsePayload: AggregateRulesResponseV1 = {
          body: transformAggregateBodyResponseV1(formatDefaultAggregationResult(aggregateResult)),
        };

        return res.ok(responsePayload);
      })
    )
  );
};
