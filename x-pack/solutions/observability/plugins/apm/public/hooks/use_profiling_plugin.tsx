/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useApmPluginContext } from '../context/apm_plugin/use_apm_plugin_context';
import { isPending, useFetcher } from './use_fetcher';
import { useProfilingPluginSetting } from './use_profiling_integration_setting';

export function useProfilingPlugin() {
  const { plugins } = useApmPluginContext();
  const isProfilingPluginEnabled = useProfilingPluginSetting();

  const { data, status } = useFetcher((callApmApi) => {
    return callApmApi('GET /internal/apm/profiling/status');
  }, []);

  const isProfilingAvailable = isProfilingPluginEnabled && data?.initialized;

  return {
    profilingLocators: isProfilingAvailable
      ? plugins.observabilityShared.locators.profiling
      : undefined,
    isProfilingPluginInitialized: data?.initialized,
    isProfilingAvailable,
    isLoading: isPending(status),
  };
}
