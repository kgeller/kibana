import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '@kbn/core/server';

import { CustomIntegrationsPluginSetup, CustomIntegrationsPluginStart } from './types';
import { defineRoutes } from './routes';

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

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('customIntegrations: Started');
    return {};
  }

  public stop() {}
}
