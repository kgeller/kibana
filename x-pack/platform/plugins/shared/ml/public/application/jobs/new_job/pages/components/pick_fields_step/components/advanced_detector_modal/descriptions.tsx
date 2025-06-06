/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC, PropsWithChildren } from 'react';
import React, { memo } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiDescribedFormGroup, EuiFormRow, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { FunctionHelpPopover } from './function_help';

interface Props {
  titleId: string;
}
export const AggDescription: FC<PropsWithChildren<Props>> = memo(({ children, titleId }) => {
  const title = i18n.translate(
    'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.aggSelect.title',
    {
      defaultMessage: 'Function',
    }
  );
  return (
    <EuiDescribedFormGroup
      title={
        <EuiFlexGroup gutterSize="none">
          <EuiFlexItem grow={false}>
            <h3 id={titleId}>{title}</h3>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <FunctionHelpPopover />
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      description={
        <FormattedMessage
          id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.aggSelect.description"
          defaultMessage="Analysis functions to be performed. For example, sum, count."
        />
      }
    >
      <EuiFormRow>
        <>{children}</>
      </EuiFormRow>
    </EuiDescribedFormGroup>
  );
});

export const FieldDescription: FC<PropsWithChildren<Props>> = memo(({ children, titleId }) => {
  const title = i18n.translate(
    'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.fieldSelect.title',
    {
      defaultMessage: 'Field',
    }
  );
  return (
    <EuiDescribedFormGroup
      title={<h3 id={titleId}>{title}</h3>}
      description={
        <FormattedMessage
          id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.fieldSelect.description"
          defaultMessage="Required for functions: sum, mean, median, max, min, info_content, distinct_count, lat_long."
        />
      }
    >
      <EuiFormRow>
        <>{children}</>
      </EuiFormRow>
    </EuiDescribedFormGroup>
  );
});

export const ByFieldDescription: FC<PropsWithChildren<Props>> = memo(({ children, titleId }) => {
  const title = i18n.translate(
    'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.byFieldSelect.title',
    {
      defaultMessage: 'By field',
    }
  );
  return (
    <EuiDescribedFormGroup
      title={<h3 id={titleId}>{title}</h3>}
      description={
        <FormattedMessage
          id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.byFieldSelect.description"
          defaultMessage="Required for individual analysis where anomalies are detected compared to an entity's own past behavior."
        />
      }
    >
      <EuiFormRow>
        <>{children}</>
      </EuiFormRow>
    </EuiDescribedFormGroup>
  );
});

export const OverFieldDescription: FC<PropsWithChildren<Props>> = memo(({ children, titleId }) => {
  const title = i18n.translate(
    'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.overFieldSelect.title',
    {
      defaultMessage: 'Over field',
    }
  );
  return (
    <EuiDescribedFormGroup
      title={<h3 id={titleId}>{title}</h3>}
      description={
        <FormattedMessage
          id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.overFieldSelect.description"
          defaultMessage="Required for population analysis where anomalies are detected compared to the behavior of the population."
        />
      }
    >
      <EuiFormRow>
        <>{children}</>
      </EuiFormRow>
    </EuiDescribedFormGroup>
  );
});

export const PartitionFieldDescription: FC<PropsWithChildren<Props>> = memo(
  ({ children, titleId }) => {
    const title = i18n.translate(
      'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.partitionFieldSelect.title',
      {
        defaultMessage: 'Partition field',
      }
    );
    return (
      <EuiDescribedFormGroup
        title={<h3 id={titleId}>{title}</h3>}
        description={
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.partitionFieldSelect.description"
            defaultMessage="Allows segmentation of modeling into logical groups."
          />
        }
      >
        <EuiFormRow>
          <>{children}</>
        </EuiFormRow>
      </EuiDescribedFormGroup>
    );
  }
);

export const ExcludeFrequentDescription: FC<PropsWithChildren<Props>> = memo(
  ({ children, titleId }) => {
    const title = i18n.translate(
      'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.excludeFrequent.title',
      {
        defaultMessage: 'Exclude frequent',
      }
    );
    return (
      <EuiDescribedFormGroup
        title={<h3 id={titleId}>{title}</h3>}
        description={
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.excludeFrequent.description"
            defaultMessage="If set, it will automatically identify and exclude frequently occurring entities which may otherwise have dominated results."
          />
        }
      >
        <EuiFormRow>
          <>{children}</>
        </EuiFormRow>
      </EuiDescribedFormGroup>
    );
  }
);

export const DescriptionDescription: FC<PropsWithChildren<Props>> = memo(
  ({ children, titleId }) => {
    const title = i18n.translate(
      'xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.description.title',
      {
        defaultMessage: 'Description',
      }
    );
    return (
      <EuiDescribedFormGroup
        fullWidth={true}
        title={<h3 id={titleId}>{title}</h3>}
        description={
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.description.description"
            defaultMessage="Override the default detector description with a meaningful description of what the detector is analyzing."
          />
        }
      >
        <EuiFormRow fullWidth={true}>
          <>{children}</>
        </EuiFormRow>
      </EuiDescribedFormGroup>
    );
  }
);
