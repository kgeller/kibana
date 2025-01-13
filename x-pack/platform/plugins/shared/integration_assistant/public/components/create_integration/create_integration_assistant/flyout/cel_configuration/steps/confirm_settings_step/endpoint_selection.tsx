/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiRadioGroupOption, EuiComboBoxOptionOption } from '@elastic/eui';
import {
  EuiBadge,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import * as i18n from './translations';
import type { IntegrationSettings } from '../../../../types';

const loadPaths = (integrationSettings: IntegrationSettings | undefined): string[] => {
  const pathObjs = integrationSettings?.apiSpec?.getPaths();
  if (!pathObjs) {
    return [];
  }
  return Object.keys(pathObjs).filter((path) => pathObjs[path].get);
};

interface EndpointSelectionProps {
  integrationSettings: IntegrationSettings | undefined;
  pathSuggestions: string[];
  selectedPath: string | undefined;
  selectedOtherPath: string | undefined;
  useOtherEndpoint: boolean;
  isGenerating: boolean;
  onChangeSuggestedPath(id: string): void;
  onChangeOtherPath(path: EuiComboBoxOptionOption[]): void;
}

export const EndpointSelection = React.memo<EndpointSelectionProps>(
  ({
    integrationSettings,
    pathSuggestions,
    selectedPath,
    selectedOtherPath,
    useOtherEndpoint,
    onChangeSuggestedPath,
    isGenerating,
    onChangeOtherPath,
  }) => {
    const allPaths = loadPaths(integrationSettings);
    const otherPathOptions = allPaths.map<EuiComboBoxOptionOption>((p) => ({ label: p }));

    const isShowingAllOptions = pathSuggestions.length === allPaths.length;

    const options = (
      isShowingAllOptions ? pathSuggestions : pathSuggestions.concat([i18n.ENTER_MANUALLY])
    ).map<EuiRadioGroupOption>((option, index) =>
      // The LLM returns the path in preference order, so we know the first option is the recommended one
      index === 0
        ? {
            id: option,
            label: (
              <EuiFlexGroup gutterSize="s">
                <EuiFlexItem>
                  <EuiText size="s">{option}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge>{i18n.RECOMMENDED}</EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
          }
        : { id: option, label: option }
    );

    return (
      <EuiFormRow fullWidth>
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>{i18n.CONFIRM_ENDPOINT}</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="s">{i18n.CONFIRM_ENDPOINT_DESCRIPTION}</EuiText>
          <EuiSpacer size="m" />
          <EuiRadioGroup
            options={options}
            idSelected={selectedPath}
            disabled={isGenerating}
            onChange={onChangeSuggestedPath}
          />
          {useOtherEndpoint && !isShowingAllOptions && (
            <EuiComboBox
              singleSelection={{ asPlainText: true }}
              fullWidth
              isDisabled={isGenerating}
              options={otherPathOptions}
              selectedOptions={
                selectedOtherPath === undefined ? undefined : [{ label: selectedOtherPath }]
              }
              onChange={onChangeOtherPath}
            />
          )}
        </EuiFlexItem>
      </EuiFormRow>
    );
  }
);
EndpointSelection.displayName = 'EndpointSelection';
