/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexItem, EuiSkeletonText } from '@elastic/eui';
import type { PropsWithChildren } from 'react';
import React from 'react';

interface Props {
  loading: boolean;
  grow?: boolean;
}

export function ServiceStat({ loading, grow = true, children }: PropsWithChildren<Props>) {
  return (
    <EuiFlexItem grow={grow}>
      {loading ? <EuiSkeletonText lines={1} style={{ marginTop: '4px' }} /> : <>{children}</>}
    </EuiFlexItem>
  );
}
