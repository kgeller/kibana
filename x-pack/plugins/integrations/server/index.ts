import { PluginInitializerContext } from '@kbn/core/server';

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export async function plugin(initializerContext: PluginInitializerContext) {
  const { CustomIntegrationsPlugin } = await import('./plugin');
  return new CustomIntegrationsPlugin(initializerContext);
}

export type { CustomIntegrationsPluginSetup, CustomIntegrationsPluginStart } from './types';
