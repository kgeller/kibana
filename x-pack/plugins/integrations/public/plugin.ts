/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { CoreStart, Plugin } from '@kbn/core/public';
import { LazyCustomCriblExtension } from './components';
import { CustomIntegrationsPluginStartDeps } from './types';

export const CUSTOM_CRIBL_INTEGRATION_NAME = 'cribl';

export type CustomIntegrationsPluginSetup = ReturnType<CustomIntegrationsPlugin['setup']>;
export type CustomIntegrationsPluginStart = void;

export class CustomIntegrationsPlugin implements Plugin<CustomIntegrationsPluginSetup,CustomIntegrationsPluginStart>
{
  public setup() {}

  public start(core: CoreStart, plugins: CustomIntegrationsPluginStartDeps): CustomIntegrationsPluginStart {
    const { registerExtension } = plugins.fleet;

    registerExtension({
      package: CUSTOM_CRIBL_INTEGRATION_NAME,
      view: 'package-policy-replace-define-step',
      Component: LazyCustomCriblExtension,
    });
  }

  public stop() {}
}
