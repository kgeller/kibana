/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiIcon,
  EuiCallOut,
  EuiButtonEmpty,
  EuiHorizontalRule,
} from '@elastic/eui';
import { isEqual } from 'lodash';
import { i18n } from '@kbn/i18n';

import { dataViewsService } from '../../services/kibana_services';
import { DatasourceSelector } from './datasource_selector';
import { DatasourcePreview } from './datasource_preview';

const strings = {
  getExpressionArgDescription: () =>
    i18n.translate('xpack.canvas.datasourceDatasourceComponent.expressionArgDescription', {
      defaultMessage:
        'The datasource has an argument controlled by an expression. Use the expression editor to modify the datasource.',
    }),
  getPreviewButtonLabel: () =>
    i18n.translate('xpack.canvas.datasourceDatasourceComponent.previewButtonLabel', {
      defaultMessage: 'Preview data',
    }),
  getSaveButtonLabel: () =>
    i18n.translate('xpack.canvas.datasourceDatasourceComponent.saveButtonLabel', {
      defaultMessage: 'Save',
    }),
};

export class DatasourceComponent extends PureComponent {
  static propTypes = {
    args: PropTypes.object.isRequired,
    datasources: PropTypes.array.isRequired,
    datasource: PropTypes.object.isRequired,
    datasourceDef: PropTypes.object.isRequired,
    stateDatasource: PropTypes.shape({
      name: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    }).isRequired,
    selectDatasource: PropTypes.func,
    setDatasourceAst: PropTypes.func,
    stateArgs: PropTypes.object.isRequired,
    updateArgs: PropTypes.func,
    resetArgs: PropTypes.func.isRequired,
    selecting: PropTypes.bool,
    setSelecting: PropTypes.func,
    previewing: PropTypes.bool,
    setPreviewing: PropTypes.func,
    isInvalid: PropTypes.bool,
    setInvalid: PropTypes.func,
    renderError: PropTypes.func,
  };

  state = { defaultIndex: '' };

  componentDidMount() {
    dataViewsService.getDefaultDataView().then((defaultDataView) => {
      this.setState({ defaultIndex: defaultDataView.title });
    });
  }

  componentDidUpdate(prevProps) {
    const { args, resetArgs, datasource, selectDatasource } = this.props;
    if (!isEqual(prevProps.args, args)) {
      resetArgs();
    }

    if (!isEqual(prevProps.datasource, datasource)) {
      selectDatasource(datasource);
    }
  }

  getDatasourceFunctionNode = (name, args) => ({
    arguments: args,
    function: name,
    type: 'function',
  });

  setSelectedDatasource = (value) => {
    const { datasource, resetArgs, updateArgs, selectDatasource, datasources, setSelecting } =
      this.props;

    if (datasource.name === value) {
      // if selecting the current datasource, reset the arguments
      resetArgs && resetArgs();
    } else {
      // otherwise, clear the arguments, the form will update them
      updateArgs && updateArgs({});
    }
    selectDatasource && selectDatasource(datasources.find((d) => d.name === value));
    setSelecting(false);
  };

  save = () => {
    const { stateDatasource, stateArgs, setDatasourceAst } = this.props;
    const datasourceAst = this.getDatasourceFunctionNode(stateDatasource.name, stateArgs);
    setDatasourceAst && setDatasourceAst(datasourceAst);
  };

  render() {
    const {
      datasources,
      datasourceDef,
      stateDatasource,
      stateArgs,
      updateArgs,
      selecting,
      setSelecting,
      previewing,
      setPreviewing,
      isInvalid,
      setInvalid,
      renderError,
    } = this.props;

    const { defaultIndex } = this.state;

    if (selecting) {
      return (
        <DatasourceSelector
          datasources={datasources}
          onSelect={this.setSelectedDatasource}
          current={stateDatasource.name}
        />
      );
    }

    const datasourcePreview = previewing ? (
      <DatasourcePreview
        show={previewing}
        done={() => setPreviewing(false)}
        function={this.getDatasourceFunctionNode(stateDatasource.name, stateArgs)}
      />
    ) : null;

    const datasourceRender = () =>
      stateDatasource.render({
        args: stateArgs,
        updateArgs,
        datasourceDef,
        isInvalid,
        setInvalid,
        defaultIndex,
        renderError,
      });

    const hasExpressionArgs = Object.values(stateArgs).some((a) => a && typeof a[0] === 'object');

    return (
      <Fragment>
        <div className="canvasDataSource__section">
          <EuiButtonEmpty
            iconSide="right"
            iconType="arrowRight"
            onClick={() => setSelecting(!selecting)}
            className="canvasDataSource__triggerButton"
            flush="left"
            size="s"
            data-test-subj="canvasChangeDatasourceButton"
          >
            <EuiIcon type={stateDatasource.image} className="canvasDataSource__triggerButtonIcon" />
            {stateDatasource.displayName}
          </EuiButtonEmpty>
          <EuiSpacer size="s" />
          {!hasExpressionArgs ? (
            <>
              {datasourceRender()}
              <EuiHorizontalRule margin="m" />
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="s" onClick={() => setPreviewing(true)}>
                    {strings.getPreviewButtonLabel()}
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    disabled={isInvalid}
                    size="s"
                    onClick={this.save}
                    fill
                    data-test-subj="canvasSaveDatasourceButton"
                  >
                    {strings.getSaveButtonLabel()}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ) : (
            <EuiCallOut color="warning">
              <p>{strings.getExpressionArgDescription()}</p>
            </EuiCallOut>
          )}
        </div>

        {datasourcePreview}
      </Fragment>
    );
  }
}
