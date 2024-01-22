/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { PackagePolicyConfigRecord } from '@kbn/fleet-plugin/common';
import { RouteEntry } from '../types';
import { getRouteEntriesFromPolicyConfig, getPolicyConfigValueFromRouteEntries } from './translator';

describe('translater', () => {
  const routeEntries = [
    { criblSourceId: "criblSource1", destinationDatastream: "logs-destination1.cloud" },
    { criblSourceId: "criblSource2", destinationDatastream: "logs-destination2"},
  ] as RouteEntry[];

  const routeEntriesPlusEmpty = [
    { criblSourceId: "criblSource1", destinationDatastream: "logs-destination1.cloud" },
    { criblSourceId: "criblSource2", destinationDatastream: "logs-destination2"},
    { criblSourceId: "", destinationDatastream: ""},
  ] as RouteEntry[];

  const policyConfig = {
    route_entries: {
      value: '[{"criblSourceId":"criblSource1","destinationDatastream":"logs-destination1.cloud"},{"criblSourceId":"criblSource2","destinationDatastream":"logs-destination2"}]',
      type: 'textarea',
    }
  } as PackagePolicyConfigRecord;

  const testString: string = '[{"criblSourceId":"criblSource1","destinationDatastream":"logs-destination1.cloud"},{"criblSourceId":"criblSource2","destinationDatastream":"logs-destination2"}]';

  it('translate from PackagePolicyConfigRecord to RouteEntry[]', () => {
    const result = getRouteEntriesFromPolicyConfig(policyConfig);
    expect(result).toEqual(routeEntries);
  });

  describe('translate from RouteEntry[] to PackagePolicyConfigRecord', () => {
    it('translate', () => {
      const result = getPolicyConfigValueFromRouteEntries(routeEntries);
      expect(result).toEqual(testString);
    });

    it('translate removes empty', () => {
      const result = getPolicyConfigValueFromRouteEntries(routeEntriesPlusEmpty);
      expect(result).toEqual(testString);
    });
  });
});