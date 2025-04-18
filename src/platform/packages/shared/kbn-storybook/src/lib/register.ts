/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

// This configures the "Manager", or main outer view of Storybook. It is an
// addon that's loaded by the `managerEntries` part of the preset in ../preset.js.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Kibana Storybook',
    brandUrl:
      'https://github.com/elastic/kibana/tree/main/src/platform/packages/shared/kbn-storybook',
  }),
  showPanel: false,
  isFullscreen: false,
  panelPosition: 'bottom',
  showToolbar: true,
});
