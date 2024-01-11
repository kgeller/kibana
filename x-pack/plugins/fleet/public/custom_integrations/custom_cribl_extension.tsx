/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from "react";
import { EuiFieldText, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSpacer } from '@elastic/eui';
import { PackagePolicyReplaceDefineStepExtensionComponent } from "../applications/fleet/types";
import { FormattedMessage } from "@kbn/i18n-react";
import styled from "styled-components";
import { i18n } from "@kbn/i18n";

const FlexItemWithLabel = styled(EuiFlexItem)`
  padding-top: 30px;
  text-align: center;
`;

interface RouteEntry {
  criblSource: string;
  datastream: string;
}

//let routeEntries = new Map<string, string>([["cs1", "ds1"], ["cs2", "ds2"], ["cs3", "ds3"]])
const routeEntries: RouteEntry[] = [
  { criblSource: "cs1", datastream: "ds1" },
  { criblSource: "cs2", datastream: "ds2" },
  { criblSource: "cs3", datastream: "ds3" },
];

export const CustomCriblExtension: PackagePolicyReplaceDefineStepExtensionComponent = () => {

  return (
    <>
    <EuiFlexGroup>
      <EuiFlexItem>
        <FormattedMessage
          id="xpack.integrations.fleetComponents.mappingInstruction"
          defaultMessage="Add mappings for your Cribl sources to a corresponding Elastic Fleet Integration data stream."
        />
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer />

    <EuiFlexGroup gutterSize="s" data-test-subj="entriesContainer">
      <EuiFlexGroup gutterSize="s" direction="column">
        {routeEntries.map((item) => (
          <EuiFlexGroup>
          <EuiFlexItem key={item.criblSource}>
            <EuiFormRow label="Cribl _dataId field">
              <EuiFieldText value={item.criblSource}/>
            </EuiFormRow>
          </EuiFlexItem>
          <FlexItemWithLabel grow={true}>
            {i18n.translate('xpack.integrations.fleetComponents.mapsTo', {
                defaultMessage: 'MAPS TO',
            })}
          </FlexItemWithLabel>
          <EuiFlexItem key={item.datastream}>
            <EuiFormRow label="Data stream">
              <EuiFieldText value={item.datastream}/>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        ))}
              
      </EuiFlexGroup>
    </EuiFlexGroup>
  </>
  );
};
