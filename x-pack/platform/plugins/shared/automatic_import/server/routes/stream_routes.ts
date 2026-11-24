/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import type { Logger } from '@kbn/logging';
import { z, lazySchema } from '@kbn/zod/v4';
import { buildRouteValidationWithZod } from '@kbn/zod-helpers/v4';
import type { AutomaticImportPluginRequestHandlerContext } from '../types';
import { buildAutomaticImportResponse } from './utils';
import { withAvailability } from './with_availability';
import { AUTOMATIC_IMPORT_API_PRIVILEGES } from '../feature';
import { getOwningPackageName, getPackageDataset } from '../services/stream_packaging/stream_setup';

export const STREAMS_PATH = '/api/automatic_import/streams';

const StreamNameParams = lazySchema(() => z.object({ stream_name: z.string().min(1).max(255) }));

/** Lets Streams show which Automatic Import integration, if any, owns a stream. */
export const registerStreamRoutes = (
  router: IRouter<AutomaticImportPluginRequestHandlerContext>,
  logger: Logger
) => {
  router.versioned
    .get({
      access: 'internal',
      path: `${STREAMS_PATH}/{stream_name}/ownership`,
      security: { authz: { requiredPrivileges: [`${AUTOMATIC_IMPORT_API_PRIVILEGES.READ}`] } },
    })
    .addVersion(
      {
        version: '1',
        validate: { request: { params: buildRouteValidationWithZod(StreamNameParams) } },
      },
      withAvailability(async (context, request, response) => {
        try {
          const { esClient, automaticImportService } = await context.automaticImport;
          const { stream_name: streamName } = request.params;
          const packageName = await getOwningPackageName(esClient, streamName);
          const integration = packageName
            ? await automaticImportService.getIntegrationById(packageName).catch(() => undefined)
            : undefined;
          const dataStreamId =
            integration && packageName ? getPackageDataset(streamName, packageName) : undefined;
          const isOwned = integration?.dataStreams.some((ds) => ds.dataStreamId === dataStreamId);
          if (!integration || !isOwned) {
            return response.ok({ body: {} });
          }
          return response.ok({
            body: { packageName, integrationId: integration.integrationId, dataStreamId },
          });
        } catch (err) {
          logger.error(`getStreamOwnershipRoute: Caught error: ${err}`);
          return buildAutomaticImportResponse(response).error({
            statusCode: 500,
            body: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );
};
