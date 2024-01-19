/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { NewPackagePolicy } from "@kbn/fleet-plugin/common";
import { RouteEntry } from "../types";

// translate from package policy to routeentry[]

export const getRouteEntriesFromPackagePolicy = (policy: NewPackagePolicy): RouteEntry[] => {
    const policyConfig = policy.vars;
    console.log(policyConfig);
    return [];
}