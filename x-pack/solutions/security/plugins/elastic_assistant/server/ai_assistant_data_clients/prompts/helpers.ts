/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { estypes } from '@elastic/elasticsearch';
import {
  PromptCreateProps,
  PromptResponse,
  PromptType,
  PromptUpdateProps,
} from '@kbn/elastic-assistant-common/impl/schemas';
import { AuthenticatedUser } from '@kbn/core-security-common';
import { CreatePromptSchema, EsPromptsSchema, UpdatePromptSchema } from './types';

export const transformESToPrompts = (response: EsPromptsSchema[]): PromptResponse[] => {
  return response.map((promptSchema) => {
    const prompt: PromptResponse = {
      timestamp: promptSchema['@timestamp'],
      createdAt: promptSchema.created_at,
      users:
        promptSchema.users?.map((user) => ({
          id: user.id,
          name: user.name,
        })) ?? [],
      content: promptSchema.content,
      isDefault: promptSchema.is_default,
      isNewConversationDefault: promptSchema.is_new_conversation_default,
      updatedAt: promptSchema.updated_at,
      namespace: promptSchema.namespace,
      id: promptSchema.id,
      name: promptSchema.name,
      promptType: promptSchema.prompt_type as unknown as PromptType,
      color: promptSchema.color,
      categories: promptSchema.categories,
      consumer: promptSchema.consumer,
      createdBy: promptSchema.created_by,
      updatedBy: promptSchema.updated_by,
    };

    return prompt;
  });
};

export const transformESSearchToPrompts = (
  response: estypes.SearchResponse<EsPromptsSchema>
): PromptResponse[] => {
  return response.hits.hits
    .filter((hit) => hit._source !== undefined)
    .map((hit) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const promptSchema = hit._source!;
      const prompt: PromptResponse = {
        timestamp: promptSchema['@timestamp'],
        createdAt: promptSchema.created_at,
        users:
          promptSchema.users?.map((user) => ({
            id: user.id,
            name: user.name,
          })) ?? [],
        content: promptSchema.content,
        isDefault: promptSchema.is_default,
        isNewConversationDefault: promptSchema.is_new_conversation_default,
        updatedAt: promptSchema.updated_at,
        namespace: promptSchema.namespace,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        id: hit._id!,
        name: promptSchema.name,
        promptType: promptSchema.prompt_type as unknown as PromptType,
        color: promptSchema.color,
        categories: promptSchema.categories,
        consumer: promptSchema.consumer,
        createdBy: promptSchema.created_by,
        updatedBy: promptSchema.updated_by,
      };

      return prompt;
    });
};

export const transformToUpdateScheme = (
  user: AuthenticatedUser,
  updatedAt: string,
  { content, isNewConversationDefault, categories, color, id }: PromptUpdateProps
): UpdatePromptSchema => {
  return {
    id,
    updated_at: updatedAt,
    content: content ?? '',
    is_new_conversation_default: isNewConversationDefault,
    categories,
    color,
    users: [
      {
        id: user.profile_uid,
        name: user.username,
      },
    ],
  };
};

export const transformToCreateScheme = (
  user: AuthenticatedUser,
  updatedAt: string,
  {
    content,
    isDefault,
    isNewConversationDefault,
    categories,
    color,
    consumer,
    name,
    promptType,
  }: PromptCreateProps
): CreatePromptSchema => {
  return {
    '@timestamp': updatedAt,
    updated_at: updatedAt,
    content: content ?? '',
    is_new_conversation_default: isNewConversationDefault,
    color,
    consumer,
    categories,
    name,
    is_default: isDefault,
    prompt_type: promptType,
    users: [
      {
        id: user.profile_uid,
        name: user.username,
      },
    ],
  };
};

export const getUpdateScript = ({
  prompt,
  isPatch,
}: {
  prompt: UpdatePromptSchema;
  isPatch?: boolean;
}) => {
  return {
    script: {
      source: `
    if (params.assignEmpty == true || params.containsKey('content')) {
      ctx._source.content = params.content;
    }
    if (params.assignEmpty == true || params.containsKey('is_new_conversation_default')) {
      ctx._source.is_new_conversation_default = params.is_new_conversation_default;
    }
    if (params.assignEmpty == true || params.containsKey('color')) {
      ctx._source.color = params.color;
    }
    if (params.assignEmpty == true || params.containsKey('categories')) {
      ctx._source.categories = params.categories;
    }
    ctx._source.updated_at = params.updated_at;
  `,
      lang: 'painless',
      params: {
        ...prompt, // when assigning undefined in painless, it will remove property and wil set it to null
        // for patch we don't want to remove unspecified value in payload
        assignEmpty: !(isPatch ?? true),
      },
    },
  };
};
