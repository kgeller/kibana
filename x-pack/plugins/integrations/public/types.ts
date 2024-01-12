/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FleetStart } from '@kbn/fleet-plugin/public';
import { DataPublicPluginStart } from '@kbn/data-plugin/public';

export interface CustomIntegrationsPluginSetupDeps {}

export interface CustomIntegrationsPluginStartDeps {
  data: DataPublicPluginStart;
  fleet: FleetStart;
}