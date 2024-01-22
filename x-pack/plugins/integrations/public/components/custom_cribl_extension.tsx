/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { memo, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { PackagePolicyReplaceDefineStepExtensionComponentProps } from '@kbn/fleet-plugin/public/types';
import { FormattedMessage } from 'react-intl';
import { getFleetManagedIndexTemplates } from '../common/api/get_fleet_managed_index_templates';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { RouteEntry } from '../../common/types';
import { getPolicyConfigValueFromRouteEntries, getRouteEntriesFromPolicyConfig } from '../../common/helpers/translator';

const getDefaultRouteEntry = () => {
  return ({
    criblSourceId: "",
    destinationDatastream: ""
  } as RouteEntry);
};

const hasAtLeastOneValidRouteEntry = (routeEntries: RouteEntry[]) => {
  return routeEntries
    .some(re => {
      const hasCriblSourceId = re.criblSourceId && re.criblSourceId.length > 0;
      const hasDataStream = re.destinationDatastream && re.destinationDatastream.length > 0;
      return hasCriblSourceId && hasDataStream;
    });
};

const allRouteEntriesArePaired = (routeEntries: RouteEntry[]) => {
  return routeEntries
    .every(re => {
      const hasCriblSourceId = re.criblSourceId && re.criblSourceId.length > 0;
      const hasDataStream = re.destinationDatastream && re.destinationDatastream.length > 0;
      return (hasCriblSourceId && hasDataStream) || (!hasCriblSourceId && !hasDataStream);
    });
};

interface RouteEntryComponentProps {
  index: number;
  routeEntries: RouteEntry[];
  dataStreamOpts: string[];
  onChangeCriblDataId(index: number, value: string): void;
  onChangeDatastream(index: number, value: string): void;
  onDeleteEntry(index: number): void;
}

const RouteEntryComponent = React.memo<RouteEntryComponentProps>(
  ({ 
    index,
    routeEntries,
    dataStreamOpts,
    onChangeCriblDataId,
    onChangeDatastream,
    onDeleteEntry
  }) => {

    const routeEntry = routeEntries[index]; // the route entry for this row

    const options = dataStreamOpts.map(o => ({
      label: o,
    }));

    const selectedOption = options.filter(o => o.label === routeEntry.destinationDatastream);

    return (
      <>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Cribl _dataId field">
              <EuiFieldText
                value={routeEntry.criblSourceId}
                onChange={(e) => onChangeCriblDataId(index, e.currentTarget.value)} />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiFlexItem grow={false}>
              {i18n.translate('xpack.integrations.fleetComponents.mapsTo', {
                defaultMessage: 'MAPS TO',
              })}
            </EuiFlexItem>
          </EuiFormRow>
          <EuiFlexItem>
            <EuiFormRow label="Data stream">
              <EuiComboBox
                placeholder="Select"
                singleSelection
                options={options}
                selectedOptions={selectedOption}
                onChange={o => {
                  if (o.length > 0) {
                    onChangeDatastream(index, o[0].label)
                  } else {
                    onChangeDatastream(index, "")
                  }
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiButtonIcon
              color="danger"
              iconType="trash"
              onClick={() => onDeleteEntry(index)}
              isDisabled={routeEntries.length === 1}
              aria-label="entryDeleteButton"
              className="itemEntryDeleteButton"
              data-test-subj="itemEntryDeleteButton"
            />
          </EuiFormRow>
        </EuiFlexGroup>
      </>
    );
  }
);

export const CustomCriblExtension = memo<PackagePolicyReplaceDefineStepExtensionComponentProps>(
  ({ newPolicy, onChange, validationResults, isEditPage }) => {
    const { http } = useKibana().services;

    const [indexTemplatesGetPermissionsError, setindexTemplatesGetPermissionsError] = useState<boolean>();
    const [dataStreamOpts, setDataStreamOpts] = useState<string[]>([]);
    
    useEffect(() => {
      const fetchData = async () => {

        const {indexTemplates, permissionsError} = await getFleetManagedIndexTemplates(http!);
        setDataStreamOpts(indexTemplates);
        
        if (permissionsError) {
          setindexTemplatesGetPermissionsError(true);
        }

      };
      fetchData();
    }, []);

    const [routeEntries, setRouteEntries] = useState<RouteEntry[]>([]);

    // Set route entries from initial state
    useEffect(() => {
      if (isEditPage) {
        const fromConfig = getRouteEntriesFromPolicyConfig(newPolicy.vars);
        if (fromConfig.length > 0) {
          setRouteEntries(fromConfig);
          return;
        }
      } 
      const defaultRouteEntries = [
        getDefaultRouteEntry(),
      ]
      setRouteEntries(defaultRouteEntries);
    }, []);

    const onChangeCriblDataId = (index: number, value: string) => {
      const newValues = [...routeEntries];
      newValues[index].criblSourceId = value;
      setRouteEntries(newValues);
      updateCriblPolicy(newValues);
    };

    const onChangeDatastream = (index: number, value: string) => {
      const newValues = [...routeEntries];
      newValues[index].destinationDatastream = value;
      setRouteEntries(newValues);
      updateCriblPolicy(newValues);
    };

    const onAddEntry = () => {
      const newValues = [
        ...routeEntries,
        getDefaultRouteEntry(),
      ];
      setRouteEntries(newValues);
      updateCriblPolicy(newValues);
    }

    const onDeleteEntry = (index: number) => {
      const newValues = routeEntries.filter((_, idx) => idx !== index);
      setRouteEntries(newValues);
      updateCriblPolicy(newValues);
    };

    const updateCriblPolicy = (
      updatedRouteEntries: RouteEntry[],
    ) => {
      const updatedPolicy = {
        ...newPolicy,
        vars: {
          route_entries: {
            value: getPolicyConfigValueFromRouteEntries(updatedRouteEntries)
          }
        }
      }

      // must have at least one filled in and all entries must have both filled in or neither
      const isValid = hasAtLeastOneValidRouteEntry(updatedRouteEntries) && allRouteEntriesArePaired(updatedRouteEntries)

      onChange({
        isValid: isValid,
        updatedPolicy: updatedPolicy
      })
    };

    return (
      <>
        {indexTemplatesGetPermissionsError && (
          <>
              <EuiCallOut
              size="s"
              title="Be sure you have the right privileges in order to populate options for datastreams."
              iconType="help"
            />
            <EuiSpacer size="l" />
            </>
        )}
        {/* {!hasAtLeastOneValidRouteEntry(routeEntries) && (
          <div>
            Must have at least one valid
          </div>
        )}
        {!allRouteEntriesArePaired(routeEntries) && (
          <div>
            All route entries must have pairs
          </div>
        )} */}
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
            {routeEntries.map((_, idx) => (
              <RouteEntryComponent
                key={idx}
                index={idx}
                routeEntries={routeEntries}
                dataStreamOpts={dataStreamOpts}
                onChangeCriblDataId={onChangeCriblDataId}
                onChangeDatastream={onChangeDatastream}
                onDeleteEntry={onDeleteEntry}
              />
            ))}
            <EuiSpacer size="s" />
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  fill
                  size="s"
                  iconType="plusInCircle"
                  onClick={onAddEntry}
                >
                  Add
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
          </EuiFlexGroup>
        </EuiFlexGroup>
      </>
    );
  }
);
