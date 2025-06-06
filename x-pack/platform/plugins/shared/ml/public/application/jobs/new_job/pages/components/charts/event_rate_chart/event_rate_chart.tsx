/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';
import type { BrushEndListener, PartialTheme } from '@elastic/charts';
import {
  HistogramBarSeries,
  Chart,
  ScaleType,
  Settings,
  TooltipType,
  Tooltip,
} from '@elastic/charts';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { useMlKibana } from '../../../../../../contexts/kibana';
import { Axes } from '../common/axes';
import type { LineChartPoint } from '../../../../common/chart_loader';
import type { Anomaly } from '../../../../common/results_loader';
import { useChartColors } from '../common/settings';
import { LoadingWrapper } from '../loading_wrapper';
import { Anomalies } from '../common/anomalies';
import { OverlayRange } from './overlay_range';

interface Props {
  eventRateChartData: LineChartPoint[];
  anomalyData?: Anomaly[];
  height: string;
  width: string;
  showAxis?: boolean;
  loading?: boolean;
  fadeChart?: boolean;
  overlayRanges?: Array<{
    start: number;
    end: number;
    color: string;
    showMarker?: boolean;
  }>;
  onBrushEnd?: BrushEndListener;
}

export const EventRateChart: FC<Props> = ({
  eventRateChartData,
  anomalyData,
  height,
  width,
  showAxis,
  loading = false,
  fadeChart,
  overlayRanges,
  onBrushEnd,
}) => {
  const {
    services: {
      charts: {
        theme: { useChartsBaseTheme },
      },
    },
  } = useMlKibana();

  const baseTheme = useChartsBaseTheme();

  const { EVENT_RATE_COLOR_WITH_ANOMALIES, EVENT_RATE_COLOR } = useChartColors();
  const barColor = fadeChart ? EVENT_RATE_COLOR_WITH_ANOMALIES : EVENT_RATE_COLOR;

  const theme: PartialTheme = {
    scales: { histogramPadding: 0.2 },
  };

  const cssOverride = css({
    // fix for the annotation label being hidden inside the bounds of the chart container
    '.echContainer': { overflow: 'visible' },
  });

  return (
    <div
      style={{ width, height }}
      data-test-subj={`mlEventRateChart ${eventRateChartData.length ? 'withData' : 'empty'}`}
    >
      <LoadingWrapper height={height} hasData={eventRateChartData.length > 0} loading={loading}>
        <Chart css={overlayRanges !== undefined ? cssOverride : undefined}>
          {showAxis === true && <Axes />}
          <Tooltip type={TooltipType.None} />
          <Settings
            onBrushEnd={onBrushEnd}
            theme={theme}
            baseTheme={baseTheme}
            locale={i18n.getLocale()}
          />

          {overlayRanges &&
            overlayRanges.map((range, i) => (
              <OverlayRange
                key={i}
                overlayKey={i}
                start={range.start}
                end={range.end}
                color={range.color}
                showMarker={range.showMarker}
              />
            ))}

          <Anomalies anomalyData={anomalyData} />
          <HistogramBarSeries
            id="event_rate"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={'time'}
            yAccessors={['value']}
            data={eventRateChartData}
            color={barColor}
          />
        </Chart>
      </LoadingWrapper>
    </div>
  );
};
