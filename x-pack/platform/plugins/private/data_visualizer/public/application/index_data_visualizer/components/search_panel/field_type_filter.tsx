/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useEuiTheme, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { css } from '@emotion/react';
import { getFieldTypeName } from '@kbn/field-utils';
import { FieldTypesHelpPopover } from '../../../common/components/field_types_filter/field_types_help_popover';
import { FieldTypeIcon } from '../../../common/components/field_type_icon';
import type { Option } from '../../../common/components/multi_select_picker';
import { MultiSelectPicker } from '../../../common/components/multi_select_picker';

export const DataVisualizerFieldTypeFilter: FC<{
  indexedFieldTypes: string[];
  setVisibleFieldTypes(q: string[]): void;
  visibleFieldTypes: string[];
}> = ({ indexedFieldTypes, setVisibleFieldTypes, visibleFieldTypes }) => {
  const { euiTheme } = useEuiTheme();
  const options: Option[] = useMemo(() => {
    return indexedFieldTypes.map((indexedFieldName) => {
      const label = getFieldTypeName(indexedFieldName) ?? indexedFieldName;

      return {
        value: indexedFieldName,
        name: (
          <EuiFlexGroup>
            <EuiFlexItem grow={true}> {label}</EuiFlexItem>
            {indexedFieldName && (
              <EuiFlexItem grow={false}>
                <FieldTypeIcon type={indexedFieldName} tooltipEnabled={false} />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        ),
      };
    });
  }, [indexedFieldTypes]);

  const fieldTypeTitle = useMemo(
    () =>
      i18n.translate('xpack.dataVisualizer.index.fieldTypeSelect', {
        defaultMessage: 'Field type',
      }),
    []
  );
  return (
    <>
      <MultiSelectPicker
        title={fieldTypeTitle}
        options={options}
        onChange={setVisibleFieldTypes}
        checkedOptions={visibleFieldTypes}
        dataTestSubj={'dataVisualizerFieldTypeSelect'}
        postfix={<FieldTypesHelpPopover fieldTypes={indexedFieldTypes} />}
        cssStyles={{
          filterGroup: css`
            margin-left: ${euiTheme.size.s};
          `,
        }}
      />
    </>
  );
};
