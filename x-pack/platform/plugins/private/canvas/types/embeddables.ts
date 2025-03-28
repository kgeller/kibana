/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  HasAppContext,
  HasDisableTriggers,
  HasType,
  PublishesReload,
  PublishesViewMode,
  PublishesUnifiedSearch,
} from '@kbn/presentation-publishing';
import type { CanAddNewPanel, HasSerializedChildState } from '@kbn/presentation-containers';

export type CanvasContainerApi = PublishesViewMode &
  CanAddNewPanel &
  HasDisableTriggers &
  HasType &
  HasSerializedChildState &
  HasAppContext &
  PublishesReload &
  Partial<PublishesUnifiedSearch> &
  Partial<HasAppContext & PublishesUnifiedSearch> & {
    reload: () => void;
  };
