/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, Fragment, useEffect, useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import {
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiRadioGroup,
} from '@elastic/eui';
import { getFields, RuleTypeParamsExpressionProps } from '@kbn/triggers-actions-ui-plugin/public';
import { ESQLLangEditor } from '@kbn/esql/public';
import { fetchFieldsFromESQL } from '@kbn/esql-editor';
import { getESQLAdHocDataview } from '@kbn/esql-utils';
import type { AggregateQuery } from '@kbn/es-query';
import { parseDuration } from '@kbn/alerting-plugin/common';
import {
  firstFieldOption,
  getTimeFieldOptions,
  getTimeOptions,
  isPerRowAggregation,
  parseAggregationResults,
} from '@kbn/triggers-actions-ui-plugin/public/common';
import { EsQueryRuleParams, EsQueryRuleMetaData, SearchType } from '../types';
import { DEFAULT_VALUES, SERVERLESS_DEFAULT_VALUES } from '../constants';
import { useTriggerUiActionServices } from '../util';
import { hasExpressionValidationErrors } from '../validation';
import { TestQueryRow } from '../test_query_row';
import {
  transformDatatableToEsqlTable,
  getEsqlQueryHits,
  ALERT_ID_SUGGESTED_MAX,
} from '../../../../common';

const ALL_DOCUMENTS = 'all';
const alertingOptions = [
  {
    id: ALL_DOCUMENTS,
    label: i18n.translate('xpack.stackAlerts.esQuery.ui.allDocumentsLabel', {
      defaultMessage: 'Create an alert if matches are found',
    }),
  },
  {
    id: 'row',
    label: i18n.translate('xpack.stackAlerts.esQuery.ui.alertPerRowLabel', {
      defaultMessage: 'Create an alert for each row',
    }),
  },
];

const getWarning = (duplicateAlertIds?: Set<string>, longAlertIds?: Set<string>) => {
  if (duplicateAlertIds && duplicateAlertIds.size > 0) {
    return i18n.translate('xpack.stackAlerts.esQuery.ui.alertPerRowWarning', {
      defaultMessage:
        'Test returned multiple rows with the same alert ID. Consider updating the query to group on different fields.',
    });
  } else if (longAlertIds && longAlertIds.size > 0) {
    return i18n.translate('xpack.stackAlerts.esQuery.ui.alertPerRowAlertIdWarning', {
      defaultMessage:
        'The number of fields used to generate the alert ID should be limited to a maximum of {max}. ',
      values: {
        max: ALERT_ID_SUGGESTED_MAX,
      },
    });
  }
};

export const EsqlQueryExpression: React.FC<
  RuleTypeParamsExpressionProps<EsQueryRuleParams<SearchType.esqlQuery>, EsQueryRuleMetaData>
> = ({ ruleParams, setRuleParams, setRuleProperty, errors }) => {
  const { expressions, http, isServerless, dataViews } = useTriggerUiActionServices();
  const { esqlQuery, timeWindowSize, timeWindowUnit, timeField, groupBy } = ruleParams;

  const [currentRuleParams, setCurrentRuleParams] = useState<
    EsQueryRuleParams<SearchType.esqlQuery>
  >({
    ...ruleParams,
    timeWindowSize: timeWindowSize ?? DEFAULT_VALUES.TIME_WINDOW_SIZE,
    timeWindowUnit: timeWindowUnit ?? DEFAULT_VALUES.TIME_WINDOW_UNIT,
    // ESQL queries compare conditions within the ES query
    // so only 'met' results are returned, therefore the threshold should always be 0
    threshold: [0],
    thresholdComparator: DEFAULT_VALUES.THRESHOLD_COMPARATOR,
    size: isServerless ? SERVERLESS_DEFAULT_VALUES.SIZE : DEFAULT_VALUES.SIZE,
    esqlQuery: esqlQuery ?? { esql: '' },
    aggType: DEFAULT_VALUES.AGGREGATION_TYPE,
    groupBy: groupBy ?? DEFAULT_VALUES.GROUP_BY,
    termSize: DEFAULT_VALUES.TERM_SIZE,
    searchType: SearchType.esqlQuery,
    // The sourceFields param is ignored for the ES|QL type
    sourceFields: [],
  });
  const [query, setQuery] = useState<AggregateQuery>(esqlQuery ?? { esql: '' });
  const [timeFieldOptions, setTimeFieldOptions] = useState([firstFieldOption]);
  const [detectedTimestamp, setDetectedTimestamp] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [radioIdSelected, setRadioIdSelected] = useState(groupBy ?? ALL_DOCUMENTS);

  const setParam = useCallback(
    (paramField: string, paramValue: unknown) => {
      setCurrentRuleParams((currentParams) => ({
        ...currentParams,
        [paramField]: paramValue,
      }));
      setRuleParams(paramField, paramValue);
    },
    [setRuleParams]
  );

  const clearParam = useCallback(
    (paramField: string) => {
      setCurrentRuleParams((currentParams) => {
        const nextParams = { ...currentParams };
        delete nextParams[paramField];
        return nextParams;
      });
      setRuleParams(paramField, undefined);
    },
    [setRuleParams]
  );

  const setDefaultExpressionValues = () => {
    setRuleProperty('params', currentRuleParams);
    if (esqlQuery?.esql) {
      refreshTimeFields(esqlQuery);
    }
  };

  useEffect(() => {
    setDefaultExpressionValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTestQuery = useCallback(async () => {
    const isGroupAgg = isPerRowAggregation(groupBy);
    const window = `${timeWindowSize}${timeWindowUnit}`;
    const emptyResult = {
      testResults: { results: [], truncated: false },
      isGrouped: true,
      timeWindow: window,
    };

    if (hasExpressionValidationErrors(currentRuleParams, isServerless)) {
      return emptyResult;
    }
    setIsLoading(true);
    const timeWindow = parseDuration(window);
    const now = Date.now();
    const table = await fetchFieldsFromESQL(
      esqlQuery,
      expressions,
      {
        from: new Date(now - timeWindow).toISOString(),
        to: new Date(now).toISOString(),
      },
      undefined,
      // create a data view with the timefield to pass into the query
      timeField
    );
    if (table) {
      const esqlTable = transformDatatableToEsqlTable(table);
      const { results, duplicateAlertIds, longAlertIds, rows, cols } = getEsqlQueryHits(
        esqlTable,
        esqlQuery.esql,
        isGroupAgg
      );
      const warning = getWarning(duplicateAlertIds, longAlertIds);

      setIsLoading(false);
      return {
        testResults: parseAggregationResults(results),
        isGrouped: isGroupAgg,
        isGroupedByRow: isGroupAgg,
        timeWindow: window,
        preview: {
          cols,
          rows,
        },
        ...(warning
          ? {
              warning,
            }
          : {}),
      };
    }
    setIsLoading(false);
    return emptyResult;
  }, [
    timeWindowSize,
    timeWindowUnit,
    currentRuleParams,
    esqlQuery,
    expressions,
    timeField,
    isServerless,
    groupBy,
  ]);

  const refreshTimeFields = useCallback(
    async (q: AggregateQuery) => {
      const fetchTimeFieldsData = async (queryObj: AggregateQuery) => {
        try {
          const esqlDataView = await getESQLAdHocDataview(queryObj.esql, dataViews);
          const indexPattern: string = esqlDataView.getIndexPattern();
          const currentEsFields = await getFields(http, [indexPattern]);
          const newTimeFieldOptions = getTimeFieldOptions(currentEsFields);
          const timestampField = esqlDataView.timeFieldName;
          return { newTimeFieldOptions, timestampField };
        } catch (e) {
          return { newTimeFieldOptions: [], timestampField: undefined };
        }
      };

      const { newTimeFieldOptions, timestampField } = await fetchTimeFieldsData(q);
      setTimeFieldOptions([firstFieldOption, ...newTimeFieldOptions]);
      if (!timeField && timestampField) {
        setParam('timeField', timestampField);
      }
      if (!newTimeFieldOptions.find(({ value }) => value === timeField)) {
        clearParam('timeField');
      }
      setDetectedTimestamp(timestampField);
    },
    [timeField, setParam, clearParam, dataViews, http]
  );

  return (
    <Fragment>
      <EuiFormRow id="queryEditor" data-test-subj="queryEsqlEditor" fullWidth>
        <ESQLLangEditor
          query={query}
          onTextLangQueryChange={(q: AggregateQuery) => {
            setQuery(q);
            setParam('esqlQuery', q);
            refreshTimeFields(q);
          }}
          onTextLangQuerySubmit={async () => {}}
          detectedTimestamp={detectedTimestamp}
          hideRunQueryText
          hideRunQueryButton
          isLoading={isLoading}
          editorIsInline
          expandToFitQueryOnMount
          hasOutline
        />
      </EuiFormRow>
      <EuiSpacer />
      <TestQueryRow
        fetch={onTestQuery}
        hasValidationErrors={hasExpressionValidationErrors(currentRuleParams, isServerless)}
        showTable
      />
      <EuiSpacer />
      <EuiFormRow
        id="timeField"
        fullWidth
        // @ts-expect-error upgrade typescript v5.1.6
        isInvalid={errors.timeField.length > 0 && timeField !== undefined}
        error={errors.timeField as string[]}
        label={
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.selectEsqlQueryTimeFieldPrompt"
            defaultMessage="Select a time field"
          />
        }
      >
        <EuiSelect
          options={timeFieldOptions}
          // @ts-expect-error upgrade typescript v5.1.6
          isInvalid={errors.timeField.length > 0 && timeField !== undefined}
          fullWidth
          name="timeField"
          data-test-subj="timeFieldSelect"
          value={timeField || ''}
          onChange={(e) => {
            setParam('timeField', e.target.value);
          }}
        />
      </EuiFormRow>
      <EuiSpacer />
      <EuiFormRow
        id="alertGroup"
        fullWidth
        // @ts-expect-error upgrade typescript v5.1.6
        isInvalid={errors.groupBy.length > 0 && groupBy !== undefined}
        error={errors.groupBy as string[]}
        label={
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.selectEsqlQueryGroupByPrompt"
            defaultMessage="Select alert group"
          />
        }
      >
        <EuiRadioGroup
          data-test-subj="groupByRadioGroup"
          options={alertingOptions}
          idSelected={radioIdSelected}
          onChange={(optionId) => {
            setRadioIdSelected(optionId);
            setParam('groupBy', optionId);
          }}
        />
      </EuiFormRow>
      <EuiSpacer />
      <EuiFlexGroup alignItems="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiFormRow
            id="timeWindowSize"
            // @ts-expect-error upgrade typescript v5.1.6
            isInvalid={errors.timeWindowSize.length > 0}
            error={errors.timeWindowSize as string[]}
            label={
              <FormattedMessage
                id="xpack.stackAlerts.esQuery.ui.setEsqlQueryTimeWindowPrompt"
                defaultMessage="Set the time window"
              />
            }
          >
            <EuiFieldNumber
              name="timeWindowSize"
              data-test-subj="timeWindowSizeNumber"
              // @ts-expect-error upgrade typescript v5.1.6
              isInvalid={errors.timeWindowSize.length > 0}
              min={0}
              value={timeWindowSize || ''}
              onChange={(e) => {
                const { value } = e.target;
                const timeWindowSizeVal = value !== '' ? parseInt(value, 10) : undefined;
                setParam('timeWindowSize', timeWindowSizeVal);
              }}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFormRow id="timeWindowUnit">
            <EuiSelect
              name="timeWindowUnit"
              data-test-subj="timeWindowUnitSelect"
              value={timeWindowUnit}
              onChange={(e) => {
                setParam('timeWindowUnit', e.target.value);
              }}
              options={getTimeOptions(timeWindowSize ?? 1)}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
};
