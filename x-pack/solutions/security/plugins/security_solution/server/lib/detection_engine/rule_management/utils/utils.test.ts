/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { partition } from 'lodash/fp';
import { Readable } from 'stream';
import type { RuleAction, ThreatMapping } from '@kbn/securitysolution-io-ts-alerting-types';
import type { PartialRule } from '@kbn/alerting-plugin/server';
import type { ActionsClient } from '@kbn/actions-plugin/server';

import type { RuleToImport } from '../../../../../common/api/detection_engine/rule_management';
import { getCreateRulesSchemaMock } from '../../../../../common/api/detection_engine/model/rule_schema/mocks';

import { requestContextMock } from '../../routes/__mocks__';
import { getOutputRuleAlertForRest } from '../../routes/__mocks__/utils';
import {
  getIdError,
  transformFindAlerts,
  transform,
  transformAlertsToRules,
  getTupleDuplicateErrorsAndUniqueRules,
  swapActionIds,
  migrateLegacyActionsIds,
  migrateLegacyInvestigationFields,
} from './utils';
import { getRuleMock } from '../../routes/__mocks__/request_responses';
import type { PartialFilter } from '../../types';
import { createBulkErrorObject } from '../../routes/utils';

import type { RuleAlertType } from '../../rule_schema';
import { getMlRuleParams, getQueryRuleParams, getThreatRuleParams } from '../../rule_schema/mocks';

import { createPromiseFromRuleImportStream } from '../logic/import/create_promise_from_rule_import_stream';
import { internalRuleToAPIResponse } from '../logic/detection_rules_client/converters/internal_rule_to_api_response';

type PromiseFromStreams = RuleToImport | Error;

const createMockImportRule = async (rule: ReturnType<typeof getCreateRulesSchemaMock>) => {
  const ndJsonStream = new Readable({
    read() {
      this.push(`${JSON.stringify(rule)}\n`);
      this.push(null);
    },
  });
  const [{ rules }] = await createPromiseFromRuleImportStream({
    stream: ndJsonStream,
    objectLimit: 1000,
  });
  return rules;
};

describe('utils', () => {
  const { clients } = requestContextMock.createTools();
  const actionsClient = {
    isSystemAction: jest.fn((id: string) => id === 'system-connector-.cases'),
  } as unknown as jest.Mocked<ActionsClient>;

  describe('internalRuleToAPIResponse', () => {
    test('should work with a full data set', () => {
      const fullRule = getRuleMock(getQueryRuleParams());
      const rule = internalRuleToAPIResponse(fullRule);
      expect(rule).toEqual(getOutputRuleAlertForRest());
    });

    test('should omit note if note is undefined', () => {
      const fullRule = getRuleMock(getQueryRuleParams());
      fullRule.params.note = undefined;
      const rule = internalRuleToAPIResponse(fullRule);
      const { note, ...expectedWithoutNote } = getOutputRuleAlertForRest();
      expect(rule).toEqual(expectedWithoutNote);
    });

    test('should return enabled is equal to false', () => {
      const fullRule = getRuleMock(getQueryRuleParams());
      fullRule.enabled = false;
      const ruleWithEnabledFalse = internalRuleToAPIResponse(fullRule);
      const expected = getOutputRuleAlertForRest();
      expected.enabled = false;
      expect(ruleWithEnabledFalse).toEqual(expected);
    });

    test('should return immutable is equal to false', () => {
      const fullRule = getRuleMock(getQueryRuleParams());
      fullRule.params.immutable = false;
      const ruleWithEnabledFalse = internalRuleToAPIResponse(fullRule);
      const expected = getOutputRuleAlertForRest();
      expect(ruleWithEnabledFalse).toEqual(expected);
    });

    test('should work with tags', () => {
      const fullRule = getRuleMock(getQueryRuleParams());
      fullRule.tags = ['tag 1', 'tag 2'];
      const rule = internalRuleToAPIResponse(fullRule);
      const expected = getOutputRuleAlertForRest();
      expected.tags = ['tag 1', 'tag 2'];
      expect(rule).toEqual(expected);
    });

    test('transforms ML Rule fields', () => {
      const mlRule = getRuleMock(getMlRuleParams());
      mlRule.params.anomalyThreshold = 55;
      mlRule.params.machineLearningJobId = ['some_job_id'];
      mlRule.params.type = 'machine_learning';

      const rule = internalRuleToAPIResponse(mlRule);
      expect(rule).toEqual(
        expect.objectContaining({
          anomaly_threshold: 55,
          machine_learning_job_id: ['some_job_id'],
          type: 'machine_learning',
        })
      );
    });

    test('transforms threat_matching fields', () => {
      const threatRule = getRuleMock(getThreatRuleParams());
      const threatFilters: PartialFilter[] = [
        {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: 'host.name: linux',
                    analyze_wildcard: true,
                    time_zone: 'Zulu',
                  },
                },
              ],
              filter: [],
              should: [],
              must_not: [],
            },
          },
        },
      ];
      const threatMapping: ThreatMapping = [
        {
          entries: [
            {
              field: 'host.name',
              value: 'host.name',
              type: 'mapping',
            },
          ],
        },
      ];
      threatRule.params.threatIndex = ['index-123'];
      threatRule.params.threatFilters = threatFilters;
      threatRule.params.threatMapping = threatMapping;
      threatRule.params.threatQuery = '*:*';

      const rule = internalRuleToAPIResponse(threatRule);
      expect(rule).toEqual(
        expect.objectContaining({
          threat_index: ['index-123'],
          threat_filters: threatFilters,
          threat_mapping: threatMapping,
          threat_query: '*:*',
        })
      );
    });

    // This has to stay here until we do data migration of saved objects and lists is removed from:
    // signal_params_schema.ts
    test('does not leak a lists structure in the transform which would cause validation issues', () => {
      const result: RuleAlertType & { lists: [] } = {
        lists: [],
        ...getRuleMock(getQueryRuleParams()),
      };
      const rule = internalRuleToAPIResponse(result);
      expect(rule).toEqual(
        expect.not.objectContaining({
          lists: [],
        })
      );
    });

    // This has to stay here until we do data migration of saved objects and exceptions_list is removed from:
    // signal_params_schema.ts
    test('does not leak an exceptions_list structure in the transform which would cause validation issues', () => {
      const result: RuleAlertType & { exceptions_list: [] } = {
        exceptions_list: [],
        ...getRuleMock(getQueryRuleParams()),
      };
      const rule = internalRuleToAPIResponse(result);
      expect(rule).toEqual(
        expect.not.objectContaining({
          exceptions_list: [],
        })
      );
    });
  });

  describe('getIdError', () => {
    test('it should have a status code', () => {
      const error = getIdError({ id: '123', ruleId: undefined });
      expect(error).toEqual({
        message: 'id: "123" not found',
        statusCode: 404,
      });
    });

    test('outputs message about id not being found if only id is defined and ruleId is undefined', () => {
      const error = getIdError({ id: '123', ruleId: undefined });
      expect(error).toEqual({
        message: 'id: "123" not found',
        statusCode: 404,
      });
    });

    test('outputs message about id not being found if only id is defined and ruleId is null', () => {
      const error = getIdError({ id: '123', ruleId: null });
      expect(error).toEqual({
        message: 'id: "123" not found',
        statusCode: 404,
      });
    });

    test('outputs message about ruleId not being found if only ruleId is defined and id is undefined', () => {
      const error = getIdError({ id: undefined, ruleId: 'rule-id-123' });
      expect(error).toEqual({
        message: 'rule_id: "rule-id-123" not found',
        statusCode: 404,
      });
    });

    test('outputs message about ruleId not being found if only ruleId is defined and id is null', () => {
      const error = getIdError({ id: null, ruleId: 'rule-id-123' });
      expect(error).toEqual({
        message: 'rule_id: "rule-id-123" not found',
        statusCode: 404,
      });
    });

    test('outputs message about both being not defined when both are undefined', () => {
      const error = getIdError({ id: undefined, ruleId: undefined });
      expect(error).toEqual({
        message: 'id or rule_id should have been defined',
        statusCode: 404,
      });
    });

    test('outputs message about both being not defined when both are null', () => {
      const error = getIdError({ id: null, ruleId: null });
      expect(error).toEqual({
        message: 'id or rule_id should have been defined',
        statusCode: 404,
      });
    });

    test('outputs message about both being not defined when id is null and ruleId is undefined', () => {
      const error = getIdError({ id: null, ruleId: undefined });
      expect(error).toEqual({
        message: 'id or rule_id should have been defined',
        statusCode: 404,
      });
    });

    test('outputs message about both being not defined when id is undefined and ruleId is null', () => {
      const error = getIdError({ id: undefined, ruleId: null });
      expect(error).toEqual({
        message: 'id or rule_id should have been defined',
        statusCode: 404,
      });
    });
  });

  describe('transformFindAlerts', () => {
    test('outputs empty data set when data set is empty correct', () => {
      const output = transformFindAlerts({ data: [], page: 1, perPage: 0, total: 0 });
      expect(output).toEqual({ data: [], page: 1, perPage: 0, total: 0 });
    });

    test('outputs 200 if the data is of type siem alert', () => {
      const output = transformFindAlerts({
        page: 1,
        perPage: 0,
        total: 0,
        data: [getRuleMock(getQueryRuleParams())],
      });
      const expected = getOutputRuleAlertForRest();
      expect(output).toEqual({
        page: 1,
        perPage: 0,
        total: 0,
        data: [expected],
      });
    });
  });

  describe('transform', () => {
    test('outputs 200 if the data is of type siem alert', () => {
      const output = transform(getRuleMock(getQueryRuleParams()));
      const expected = getOutputRuleAlertForRest();
      expect(output).toEqual(expected);
    });

    test('returns 500 if the data is not of type siem alert', () => {
      const unsafeCast = { data: [{ random: 1 }] } as unknown as PartialRule;
      const output = transform(unsafeCast);
      expect(output).toBeNull();
    });
  });

  describe('transformAlertsToRules', () => {
    test('given an empty array returns an empty array', () => {
      expect(transformAlertsToRules([])).toEqual([]);
    });

    test('given single alert will return the alert transformed', () => {
      const result1 = getRuleMock(getQueryRuleParams());
      const transformed = transformAlertsToRules([result1]);
      const expected = getOutputRuleAlertForRest();
      expect(transformed).toEqual([expected]);
    });

    test('given two alerts will return the two alerts transformed', () => {
      const result1 = getRuleMock(getQueryRuleParams());
      const result2 = getRuleMock(getQueryRuleParams());
      result2.id = 'some other id';
      result2.params.ruleId = 'some other id';

      const transformed = transformAlertsToRules([result1, result2]);
      const expected1 = getOutputRuleAlertForRest();
      const expected2 = getOutputRuleAlertForRest();
      expected2.id = 'some other id';
      expected2.rule_id = 'some other id';
      expect(transformed).toEqual([expected1, expected2]);
    });
  });

  describe('getTupleDuplicateErrorsAndUniqueRules', () => {
    test('returns tuple of empty duplicate errors array and rule array with instance of Syntax Error when imported rule contains parse error', async () => {
      // This is a string because we have a double "::" below to make an error happen on purpose.
      const multipartPayload =
        '{"name"::"Simple Rule Query","description":"Simple Rule Query","risk_score":1,"rule_id":"rule-1","severity":"high","type":"query","query":"user.name: root or user.name: admin"}\n';
      const ndJsonStream = new Readable({
        read() {
          this.push(multipartPayload);
          this.push(null);
        },
      });
      const [{ rules }] = await createPromiseFromRuleImportStream({
        stream: ndJsonStream,
        objectLimit: 1000,
      });
      const [errors, output] = getTupleDuplicateErrorsAndUniqueRules(rules, false);
      const isInstanceOfError = output[0] instanceof Error;

      expect(isInstanceOfError).toEqual(true);
      expect(errors.length).toEqual(0);
    });

    test('returns tuple of duplicate conflict error and single rule when rules with matching rule-ids passed in and `overwrite` is false', async () => {
      const rule = getCreateRulesSchemaMock('rule-1');
      const rule2 = getCreateRulesSchemaMock('rule-1');
      const ndJsonStream = new Readable({
        read() {
          this.push(`${JSON.stringify(rule)}\n`);
          this.push(`${JSON.stringify(rule2)}\n`);
          this.push(null);
        },
      });
      const [{ rules }] = await createPromiseFromRuleImportStream({
        stream: ndJsonStream,
        objectLimit: 1000,
      });

      const [errors, output] = getTupleDuplicateErrorsAndUniqueRules(rules, false);

      expect(output.length).toEqual(1);
      expect(errors).toEqual([
        {
          error: {
            message: 'More than one rule with rule-id: "rule-1" found',
            status_code: 400,
          },
          rule_id: 'rule-1',
        },
      ]);
    });

    test('returns tuple of duplicate conflict error and single rule when rules with matching ids passed in and `overwrite` is false', async () => {
      const rule = getCreateRulesSchemaMock('rule-1');
      delete rule.rule_id;
      const rule2 = getCreateRulesSchemaMock('rule-1');
      delete rule2.rule_id;
      const ndJsonStream = new Readable({
        read() {
          this.push(`${JSON.stringify(rule)}\n`);
          this.push(`${JSON.stringify(rule2)}\n`);
          this.push(null);
        },
      });
      const [{ rules }] = await createPromiseFromRuleImportStream({
        stream: ndJsonStream,
        objectLimit: 1000,
      });

      const [errors, output] = getTupleDuplicateErrorsAndUniqueRules(rules, false);
      const isInstanceOfError = output[0] instanceof Error;

      expect(isInstanceOfError).toEqual(true);
      expect(errors).toEqual([]);
    });

    test('returns tuple of empty duplicate errors array and single rule when rules with matching rule-ids passed in and `overwrite` is true', async () => {
      const rule = getCreateRulesSchemaMock('rule-1');
      const rule2 = getCreateRulesSchemaMock('rule-1');
      const ndJsonStream = new Readable({
        read() {
          this.push(`${JSON.stringify(rule)}\n`);
          this.push(`${JSON.stringify(rule2)}\n`);
          this.push(null);
        },
      });
      const [{ rules }] = await createPromiseFromRuleImportStream({
        stream: ndJsonStream,
        objectLimit: 1000,
      });

      const [errors, output] = getTupleDuplicateErrorsAndUniqueRules(rules, true);

      expect(output.length).toEqual(1);
      expect(errors.length).toEqual(0);
    });

    test('returns tuple of empty duplicate errors array and single rule when rules without a rule-id is passed in', async () => {
      const simpleRule = getCreateRulesSchemaMock();
      delete simpleRule.rule_id;
      const multipartPayload = `${JSON.stringify(simpleRule)}\n`;
      const ndJsonStream = new Readable({
        read() {
          this.push(multipartPayload);
          this.push(null);
        },
      });
      const [{ rules }] = await createPromiseFromRuleImportStream({
        stream: ndJsonStream,
        objectLimit: 1000,
      });

      const [errors, output] = getTupleDuplicateErrorsAndUniqueRules(rules, false);
      const isInstanceOfError = output[0] instanceof Error;

      expect(isInstanceOfError).toEqual(true);
      expect(errors.length).toEqual(0);
    });
  });

  describe('swapActionIds', () => {
    const mockAction: RuleAction = {
      group: 'group string',
      id: 'some-7.x-id',
      action_type_id: '.slack',
      params: {},
    };
    const soClient = clients.core.savedObjects.getClient();
    beforeEach(() => {
      soClient.find.mockReset();
      soClient.find.mockClear();
    });

    test('returns error if Elasticsearch query fails', async () => {
      soClient.find.mockRejectedValue(new Error('failed to query'));
      const result = await swapActionIds(mockAction, soClient);
      expect((result as Error).message).toEqual('failed to query');
    });

    test('returns original action if Elasticsearch query returns no hits', async () => {
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [],
      }));
      const result = await swapActionIds(mockAction, soClient);
      expect(result).toEqual(mockAction);
    });

    test('returns error if conflicting action connectors are found -> two hits found with same originId', async () => {
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'fake id 1', type: 'action', attributes: {}, references: [] },
          { score: 0, id: 'fake id 2', type: 'action', attributes: {}, references: [] },
        ],
      }));
      const result = await swapActionIds(mockAction, soClient);
      expect(result instanceof Error).toBeTruthy();
      expect((result as unknown as Error).message).toEqual(
        'Found two action connectors with originId or _id: some-7.x-id The upload cannot be completed unless the _id or the originId of the action connector is changed. See https://www.elastic.co/guide/en/kibana/current/sharing-saved-objects.html for more details'
      );
    });

    test('returns action with new migrated _id if a single hit is found when querying by action connector originId', async () => {
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
        ],
      }));
      const result = await swapActionIds(mockAction, soClient);
      expect(result).toEqual({ ...mockAction, id: 'new-post-8.0-id' });
    });
  });

  describe('migrateLegacyActionsIds', () => {
    const mockAction: RuleAction = {
      group: 'group string',
      id: 'some-7.x-id',
      action_type_id: '.slack',
      params: {},
    };
    const soClient = clients.core.savedObjects.getClient();
    beforeEach(() => {
      soClient.find.mockReset();
      soClient.find.mockClear();
    });
    test('returns import rules schemas + migrated action', async () => {
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        actions: [mockAction],
      };
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
        ],
      }));

      const res = await migrateLegacyActionsIds(
        // @ts-expect-error
        [rule],
        soClient,
        actionsClient
      );
      expect(res).toEqual([{ ...rule, actions: [{ ...mockAction, id: 'new-post-8.0-id' }] }]);
    });

    test('returns import rules schemas + multiple migrated action', async () => {
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        actions: [mockAction, { ...mockAction, id: 'different-id' }],
      };
      soClient.find.mockImplementation(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
        ],
      }));

      const res = await migrateLegacyActionsIds(
        // @ts-expect-error
        [rule],
        soClient,
        actionsClient
      );
      expect(res).toEqual([
        {
          ...rule,
          actions: [
            { ...mockAction, id: 'new-post-8.0-id' },
            { ...mockAction, id: 'new-post-8.0-id' },
          ],
        },
      ]);
    });

    test('returns import rules schemas + one migrated action + one error', async () => {
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        actions: [mockAction, { ...mockAction, id: 'different-id' }],
      };
      const rules = await createMockImportRule(rule);
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
        ],
      }));

      soClient.find.mockRejectedValueOnce(new Error('failed to query'));

      const res = await migrateLegacyActionsIds(rules, soClient, actionsClient);
      expect(soClient.find.mock.calls).toHaveLength(2);
      const [error, ruleRes] = partition<PromiseFromStreams, Error>(
        (item): item is Error => item instanceof Error
      )(res);

      expect(ruleRes[0]).toEqual({
        ...rules[0],
        actions: [{ ...mockAction, id: 'new-post-8.0-id' }],
      });
      expect(error[0]).toEqual(
        new Error(
          JSON.stringify(
            createBulkErrorObject({
              ruleId: rule.rule_id,
              statusCode: 409,
              message: `${[new Error('failed to query')].map((e: Error) => e.message).join(',')}`,
            })
          )
        )
      );
    });

    test('returns import rules schemas + migrated action resulting in error', async () => {
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        // only passing in one action here
        actions: [mockAction],
      };
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          // two actions are being returned, thus resulting in a conflict
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
          { score: 0, id: 'new-post-8.0-id-2', type: 'action', attributes: {}, references: [] },
        ],
      }));

      const res = await migrateLegacyActionsIds(
        // @ts-expect-error
        [rule],
        soClient,
        actionsClient
      );
      expect(res[1] instanceof Error).toBeTruthy();
      expect((res[1] as unknown as Error).message).toEqual(
        JSON.stringify({
          rule_id: 'rule-1',
          error: {
            status_code: 409,
            message:
              // error message for when two or more action connectors are found for a single id
              'Found two action connectors with originId or _id: some-7.x-id The upload cannot be completed unless the _id or the originId of the action connector is changed. See https://www.elastic.co/guide/en/kibana/current/sharing-saved-objects.html for more details',
          },
        })
      );
    });
    test('returns import multiple rules schemas + migrated action, one success and one error', async () => {
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        actions: [mockAction],
      };

      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
        ],
      }));
      soClient.find.mockImplementationOnce(async () => ({
        total: 0,
        per_page: 0,
        page: 1,
        saved_objects: [
          { score: 0, id: 'new-post-8.0-id', type: 'action', attributes: {}, references: [] },
          { score: 0, id: 'new-post-8.0-id-2', type: 'action', attributes: {}, references: [] },
        ],
      }));

      const res = await migrateLegacyActionsIds(
        // @ts-expect-error
        [rule, rule],
        soClient,
        actionsClient
      );
      expect(res[0]).toEqual({ ...rule, actions: [{ ...mockAction, id: 'new-post-8.0-id' }] });
      expect(res[1]).toEqual({ ...rule, actions: [] });
      expect(res[2] instanceof Error).toBeTruthy();
      expect((res[2] as unknown as Error).message).toEqual(
        JSON.stringify({
          rule_id: 'rule-1',
          error: {
            status_code: 409,
            message:
              'Found two action connectors with originId or _id: some-7.x-id The upload cannot be completed unless the _id or the originId of the action connector is changed. See https://www.elastic.co/guide/en/kibana/current/sharing-saved-objects.html for more details',
          },
        })
      );
    });
    test('does not migrate system actions', async () => {
      const mockSystemAction: RuleAction = {
        group: 'group string',
        id: 'system-connector-.cases',
        action_type_id: '.case',
        params: {},
      };
      const rule: ReturnType<typeof getCreateRulesSchemaMock> = {
        ...getCreateRulesSchemaMock('rule-1'),
        actions: [mockSystemAction],
      };
      const res = await migrateLegacyActionsIds(
        // @ts-expect-error
        [rule],
        soClient,
        actionsClient
      );
      expect(res).toEqual([{ ...rule, actions: [{ ...mockSystemAction }] }]);
    });
  });

  describe('migrateLegacyInvestigationFields', () => {
    test('should return undefined if value not set', () => {
      const result = migrateLegacyInvestigationFields(undefined);
      expect(result).toEqual(undefined);
    });

    test('should migrate array to object', () => {
      const result = migrateLegacyInvestigationFields(['foo']);
      expect(result).toEqual({ field_names: ['foo'] });
    });

    test('should migrate empty array to undefined', () => {
      const result = migrateLegacyInvestigationFields([]);
      expect(result).toEqual(undefined);
    });

    test('should not migrate if already intended type', () => {
      const result = migrateLegacyInvestigationFields({ field_names: ['foo'] });
      expect(result).toEqual({ field_names: ['foo'] });
    });
  });
});
