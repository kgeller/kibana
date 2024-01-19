/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '@kbn/core/server';

import { CustomIntegrationsPluginSetup, CustomIntegrationsPluginStart, StartPlugins } from './types';
import { defineRoutes } from './routes';
import { NewPackagePolicy } from '@kbn/fleet-plugin/common';
import { isCriblPackage } from './common/utils';

export class CustomIntegrationsPlugin
  implements Plugin<CustomIntegrationsPluginSetup, CustomIntegrationsPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('customIntegrations: Setup');

    const router = core.http.createRouter();
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart, plugins: StartPlugins) {
    this.logger.debug('customIntegrations: Started');
    // TODO register fleet callback
    plugins.fleet?.registerExternalCallback(
      'packagePolicyCreate',
      async (packagePolicy: NewPackagePolicy): Promise<NewPackagePolicy> => {
        if (isCriblPackage(packagePolicy.package?.name)) {
          // api call to ingest
        }

        console.log(packagePolicy.vars);
        return packagePolicy;
      }
    );

    return {};
  }

  public stop() {}
}
