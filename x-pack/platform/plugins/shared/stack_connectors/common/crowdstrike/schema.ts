/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { SUB_ACTION } from './constants';

// Connector schema
export const CrowdstrikeConfigSchema = schema.object({
  url: schema.string(),
});
export const CrowdstrikeSecretsSchema = schema.object({
  clientId: schema.string(),
  clientSecret: schema.string(),
});

export const CrowdstrikeApiDoNotValidateResponsesSchema = schema.any();

export const RelaxedCrowdstrikeBaseApiResponseSchema = schema.maybe(
  schema.object({}, { unknowns: 'allow' })
);
export const CrowdstrikeBaseApiResponseSchema = schema.object(
  {
    resources: schema.arrayOf(schema.any()),
    errors: schema.nullable(schema.arrayOf(schema.any())),
    meta: schema.object(
      {
        query_time: schema.maybe(schema.number()),
        powered_by: schema.maybe(schema.string()),
        trace_id: schema.maybe(schema.string()),
      },
      { unknowns: 'allow' }
    ),
  },
  { unknowns: 'allow' }
);

export const CrowdstrikeGetAgentOnlineStatusResponseSchema = schema.object(
  {
    resources: schema.arrayOf(
      schema.object(
        {
          state: schema.maybe(schema.string()),
          id: schema.maybe(schema.string()),
          last_seen: schema.maybe(schema.string()),
        },
        { unknowns: 'allow' }
      )
    ),
    errors: schema.nullable(schema.arrayOf(schema.any())),
    meta: schema.object(
      {
        query_time: schema.maybe(schema.number()),
        powered_by: schema.maybe(schema.string()),
        trace_id: schema.maybe(schema.string()),
      },
      { unknowns: 'allow' }
    ),
  },
  { unknowns: 'allow' }
);

export const CrowdstrikeGetAgentsResponseSchema = schema.object(
  {
    resources: schema.arrayOf(
      schema.object(
        {
          device_id: schema.maybe(schema.string()),
          cid: schema.maybe(schema.string()),
          agent_load_flags: schema.maybe(schema.string()),
          agent_local_time: schema.maybe(schema.string()),
          agent_version: schema.maybe(schema.string()),
          bios_manufacturer: schema.maybe(schema.string()),
          bios_version: schema.maybe(schema.string()),
          config_id_base: schema.maybe(schema.string()),
          config_id_build: schema.maybe(schema.string()),
          config_id_platform: schema.maybe(schema.string()),
          cpu_signature: schema.maybe(schema.string()),
          cpu_vendor: schema.maybe(schema.string()),
          external_ip: schema.maybe(schema.string()),
          mac_address: schema.maybe(schema.string()),
          instance_id: schema.maybe(schema.string()),
          service_provider: schema.maybe(schema.string()),
          service_provider_account_id: schema.maybe(schema.string()),
          hostname: schema.maybe(schema.string()),
          first_seen: schema.maybe(schema.string()),
          last_login_timestamp: schema.maybe(schema.string()),
          last_login_user: schema.maybe(schema.string()),
          last_login_uid: schema.maybe(schema.string()),
          last_seen: schema.maybe(schema.string()),
          local_ip: schema.maybe(schema.string()),
          major_version: schema.maybe(schema.string()),
          minor_version: schema.maybe(schema.string()),
          os_version: schema.maybe(schema.string()),
          platform_id: schema.maybe(schema.string()),
          platform_name: schema.maybe(schema.string()),
          policies: schema.maybe(
            schema.arrayOf(
              schema.object(
                {
                  policy_type: schema.maybe(schema.string()),
                  policy_id: schema.maybe(schema.string()),
                  applied: schema.maybe(schema.boolean()),
                  settings_hash: schema.maybe(schema.string()),
                  assigned_date: schema.maybe(schema.string()),
                  applied_date: schema.maybe(schema.string()),
                  rule_groups: schema.maybe(schema.any()),
                },
                { unknowns: 'allow' }
              )
            )
          ),
          reduced_functionality_mode: schema.maybe(schema.string()),
          device_policies: schema.maybe(
            schema.object(
              {
                prevention: schema.object(
                  {
                    policy_type: schema.maybe(schema.string()),
                    policy_id: schema.maybe(schema.string()),
                    applied: schema.maybe(schema.boolean()),
                    settings_hash: schema.maybe(schema.string()),
                    assigned_date: schema.maybe(schema.string()),
                    applied_date: schema.maybe(schema.string()),
                    rule_groups: schema.maybe(schema.any()),
                  },
                  { unknowns: 'allow' }
                ),
                sensor_update: schema.object(
                  {
                    policy_type: schema.maybe(schema.string()),
                    policy_id: schema.maybe(schema.string()),
                    applied: schema.maybe(schema.boolean()),
                    settings_hash: schema.maybe(schema.string()),
                    assigned_date: schema.maybe(schema.string()),
                    applied_date: schema.maybe(schema.string()),
                    uninstall_protection: schema.maybe(schema.string()),
                  },
                  { unknowns: 'allow' }
                ),
                global_config: schema.object(
                  {
                    policy_type: schema.maybe(schema.string()),
                    policy_id: schema.maybe(schema.string()),
                    applied: schema.maybe(schema.boolean()),
                    settings_hash: schema.maybe(schema.string()),
                    assigned_date: schema.maybe(schema.string()),
                    applied_date: schema.maybe(schema.string()),
                  },
                  { unknowns: 'allow' }
                ),
                remote_response: schema.object(
                  {
                    policy_type: schema.maybe(schema.string()),
                    policy_id: schema.maybe(schema.string()),
                    applied: schema.maybe(schema.boolean()),
                    settings_hash: schema.maybe(schema.string()),
                    assigned_date: schema.maybe(schema.string()),
                    applied_date: schema.maybe(schema.string()),
                  },
                  { unknowns: 'allow' }
                ),
              },
              { unknowns: 'allow' }
            )
          ),
          groups: schema.maybe(schema.arrayOf(schema.any())),
          group_hash: schema.maybe(schema.string()),
          product_type_desc: schema.maybe(schema.string()),
          provision_status: schema.maybe(schema.string()),
          serial_number: schema.maybe(schema.string()),
          status: schema.maybe(schema.string()),
          system_manufacturer: schema.maybe(schema.string()),
          system_product_name: schema.maybe(schema.string()),
          tags: schema.maybe(schema.arrayOf(schema.any())),
          modified_timestamp: schema.any(),
          meta: schema.maybe(
            schema.object(
              {
                version: schema.maybe(schema.string()),
                version_string: schema.maybe(schema.string()),
              },
              { unknowns: 'allow' }
            )
          ),
          zone_group: schema.maybe(schema.string()),
          kernel_version: schema.maybe(schema.string()),
          chassis_type: schema.maybe(schema.string()),
          chassis_type_desc: schema.maybe(schema.string()),
          connection_ip: schema.maybe(schema.string()),
          default_gateway_ip: schema.maybe(schema.string()),
          connection_mac_address: schema.maybe(schema.string()),
          linux_sensor_mode: schema.maybe(schema.string()),
          deployment_type: schema.maybe(schema.string()),
        },
        { unknowns: 'allow' }
      )
    ),
    errors: schema.nullable(schema.arrayOf(schema.any())),
    meta: schema.object(
      {
        query_time: schema.maybe(schema.number()),
        powered_by: schema.maybe(schema.string()),
        trace_id: schema.maybe(schema.string()),
      },
      { unknowns: 'allow' }
    ),
  },
  { unknowns: 'allow' }
);
export const CrowdstrikeHostActionsResponseSchema = schema.object(
  {
    resources: schema.arrayOf(
      schema.object(
        {
          id: schema.maybe(schema.string()),
          path: schema.maybe(schema.string()),
        },
        { unknowns: 'allow' }
      )
    ),
    meta: schema.object(
      {
        query_time: schema.maybe(schema.number()),
        powered_by: schema.maybe(schema.string()),
        trace_id: schema.maybe(schema.string()),
      },
      { unknowns: 'allow' }
    ),
    errors: schema.nullable(schema.arrayOf(schema.any())),
  },
  { unknowns: 'allow' }
);

// TODO temporary any value
export const CrowdstrikeRTRCommandParamsSchema = schema.any();
export const CrowdstrikeHostActionsParamsSchema = schema.object({
  command: schema.oneOf([schema.literal('contain'), schema.literal('lift_containment')]),
  actionParameters: schema.maybe(schema.object({}, { unknowns: 'allow' })),
  ids: schema.arrayOf(schema.string()),
  alertIds: schema.maybe(schema.arrayOf(schema.string())),
  comment: schema.maybe(schema.string()),
});

export const CrowdstrikeGetAgentsParamsSchema = schema.object({
  ids: schema.arrayOf(schema.string()),
});
export const CrowdstrikeGetTokenResponseSchema = schema.object(
  {
    access_token: schema.string(),
    expires_in: schema.number(),
    token_type: schema.string(),
    id_token: schema.maybe(schema.string()),
    issued_token_type: schema.maybe(schema.string()),
    refresh_token: schema.maybe(schema.string()),
    scope: schema.maybe(schema.string()),
  },
  { unknowns: 'allow' }
);

export const CrowdstrikeHostActionsSchema = schema.object({
  subAction: schema.literal(SUB_ACTION.HOST_ACTIONS),
  subActionParams: CrowdstrikeHostActionsParamsSchema,
});

export const CrowdstrikeActionParamsSchema = schema.oneOf([CrowdstrikeHostActionsSchema]);

export const CrowdstrikeInitRTRResponseSchema = schema.object(
  {
    meta: schema.maybe(
      schema.object(
        {
          query_time: schema.maybe(schema.number()),
          powered_by: schema.maybe(schema.string()),
          trace_id: schema.maybe(schema.string()),
        },
        { unknowns: 'allow' }
      )
    ),
    batch_id: schema.maybe(schema.string()),
    resources: schema.maybe(
      schema.recordOf(
        schema.string(),
        schema.object(
          {
            session_id: schema.maybe(schema.string()),
            task_id: schema.maybe(schema.string()),
            complete: schema.maybe(schema.boolean()),
            stdout: schema.maybe(schema.string()),
            stderr: schema.maybe(schema.string()),
            base_command: schema.maybe(schema.string()),
            aid: schema.maybe(schema.string()),
            errors: schema.maybe(schema.arrayOf(schema.any())),
            query_time: schema.maybe(schema.number()),
            offline_queued: schema.maybe(schema.boolean()),
          },
          { unknowns: 'allow' }
        )
      )
    ),
    errors: schema.maybe(schema.arrayOf(schema.any())),
  },
  { unknowns: 'allow' }
);

export const CrowdstrikeInitRTRParamsSchema = schema.object({
  endpoint_ids: schema.arrayOf(schema.string()),
});

export const CrowdstrikeExecuteRTRResponseSchema = schema.object(
  {
    combined: schema.object(
      {
        resources: schema.recordOf(
          schema.string(),
          schema.object(
            {
              session_id: schema.string(),
              task_id: schema.string(),
              complete: schema.boolean(),
              stdout: schema.string(),
              stderr: schema.string(),
              base_command: schema.string(),
              aid: schema.string(),
              errors: schema.arrayOf(schema.any()),
              query_time: schema.number(),
              offline_queued: schema.boolean(),
            },
            { unknowns: 'allow' }
          )
        ),
      },
      { unknowns: 'allow' }
    ),
    meta: schema.object(
      {
        query_time: schema.number(),
        powered_by: schema.string(),
        trace_id: schema.string(),
      },
      { unknowns: 'allow' }
    ),
    errors: schema.nullable(schema.arrayOf(schema.any())),
  },
  { unknowns: 'allow' }
);

export const CrowdstrikeGetScriptsResponseSchema = schema.object(
  {
    meta: schema.maybe(
      schema.object(
        {
          query_time: schema.maybe(schema.number()),
          powered_by: schema.maybe(schema.string()),
          trace_id: schema.maybe(schema.string()),
        },
        { unknowns: 'allow' }
      )
    ),
    resources: schema.maybe(
      schema.arrayOf(
        schema.object(
          {
            content: schema.maybe(schema.string()),
            created_by: schema.maybe(schema.string()),
            created_by_uuid: schema.maybe(schema.string()),
            created_timestamp: schema.maybe(schema.string()),
            file_type: schema.maybe(schema.string()),
            id: schema.maybe(schema.string()),
            description: schema.maybe(schema.string()),
            modified_by: schema.maybe(schema.string()),
            modified_timestamp: schema.maybe(schema.string()),
            name: schema.maybe(schema.string()),
            permission_type: schema.maybe(schema.string()),
            platform: schema.maybe(schema.arrayOf(schema.string())),
            run_attempt_count: schema.maybe(schema.number()),
            run_success_count: schema.maybe(schema.number()),
            sha256: schema.maybe(schema.string()),
            size: schema.maybe(schema.number()),
            write_access: schema.maybe(schema.boolean()),
          },
          { unknowns: 'allow' }
        )
      )
    ),
    errors: schema.maybe(schema.arrayOf(schema.any())),
  },
  { unknowns: 'allow' }
);
