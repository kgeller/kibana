/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { INTEGRATIONS_CRIBL_PACKAGE_NAME } from '../../common/constants';

export const isCriblPackage = (packageName?: string) =>
  packageName === INTEGRATIONS_CRIBL_PACKAGE_NAME;
