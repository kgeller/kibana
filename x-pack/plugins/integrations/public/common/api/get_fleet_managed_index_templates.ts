/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { HttpSetup } from '@kbn/core/public';

export const getFleetManagedIndexTemplates = async (http: HttpSetup): Promise<string[]> => {
  return await http.get<string[]>('/internal/integrations/fleet_index_templates', {
    version: '1',
  });
};
