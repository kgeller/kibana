/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { cleanup, render } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
// Necessary until components being tested are migrated of styled-components https://github.com/elastic/kibana/issues/219037
import 'jest-styled-components';
import {
  useGlobalFullScreen,
  useTimelineFullScreen,
} from '../../../common/containers/use_full_screen';
import { createMockStore, mockGlobalState, TestProviders } from '../../../common/mock';
import { TimelineId } from '../../../../common/types/timeline';
import { GraphOverlay } from '.';
import { useStateSyncingActions } from '../../../resolver/view/use_state_syncing_actions';
import { TableId } from '@kbn/securitysolution-data-table';

jest.mock('../../../common/containers/use_full_screen', () => ({
  useGlobalFullScreen: jest.fn(),
  useTimelineFullScreen: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useLocation: jest.fn().mockReturnValue({ pathname: '' }) };
});

jest.mock('../../../resolver/view/use_resolver_query_params_cleaner');
jest.mock('../../../resolver/view/use_state_syncing_actions');
const useStateSyncingActionsMock = useStateSyncingActions as jest.Mock;

jest.mock('../../../resolver/view/use_sync_selected_node');
jest.mock('../../../common/lib/kibana', () => {
  const original = jest.requireActual('../../../common/lib/kibana');
  return {
    ...original,
    useKibana: () => ({
      services: {
        sessionView: {
          getSessionView: () => <div />,
        },
        data: {
          search: {
            search: jest.fn(),
          },
        },
      },
    }),
  };
});

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const original = jest.requireActual('react-redux');

  return {
    ...original,
    useDispatch: () => mockDispatch,
  };
});

describe('GraphOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGlobalFullScreen as jest.Mock).mockReturnValue({
      globalFullScreen: false,
      setGlobalFullScreen: jest.fn(),
    });
    (useTimelineFullScreen as jest.Mock).mockReturnValue({
      timelineFullScreen: false,
      setTimelineFullScreen: jest.fn(),
    });
  });

  describe('when used in an events viewer (i.e. in the Detections view, or the Host > Events view)', () => {
    test('it has 100% width when NOT in full screen mode', () => {
      const wrapper = render(
        <TestProviders>
          <GraphOverlay Navigation={<div />} scopeId={TableId.test} />
        </TestProviders>
      );

      const overlayContainer = wrapper.getByTestId('overlayContainer');
      expect(overlayContainer).toHaveStyleRule('width', '100%');
    });

    test('it has a fixed position when in full screen mode', () => {
      (useGlobalFullScreen as jest.Mock).mockReturnValue({
        globalFullScreen: true,
        setGlobalFullScreen: jest.fn(),
      });
      (useTimelineFullScreen as jest.Mock).mockReturnValue({
        timelineFullScreen: false,
        setTimelineFullScreen: jest.fn(),
      });

      const wrapper = render(
        <TestProviders>
          <GraphOverlay Navigation={<div />} scopeId={TableId.test} />
        </TestProviders>
      );

      const overlayContainer = wrapper.getByTestId('overlayContainer');
      expect(overlayContainer).toHaveStyleRule('position', 'fixed');
    });

    test('it gets index pattern from default data view', () => {
      render(
        <TestProviders
          store={createMockStore({
            ...mockGlobalState,
            timeline: {
              ...mockGlobalState.timeline,
              timelineById: {
                [TimelineId.test]: {
                  ...mockGlobalState.timeline.timelineById[TimelineId.test],
                  graphEventId: 'definitely-not-null',
                },
              },
            },
          })}
        >
          <GraphOverlay Navigation={<div />} scopeId={TableId.test} />
        </TestProviders>
      );

      expect(useStateSyncingActionsMock.mock.calls[0][0].indices).toEqual(
        mockGlobalState.sourcerer.sourcererScopes.analyzer.selectedPatterns
      );
    });
  });

  describe('when used in the active timeline', () => {
    const timelineId = TimelineId.active;
    afterAll(() => {
      cleanup();
    });

    test('it has 100% width when NOT in full screen mode', () => {
      const wrapper = render(
        <TestProviders>
          <GraphOverlay Navigation={<div />} scopeId={timelineId} />
        </TestProviders>
      );

      const overlayContainer = wrapper.getByTestId('overlayContainer');
      expect(overlayContainer).toHaveStyleRule('width', '100%');
    });

    test('it has 100% width when the active timeline is in full screen mode', () => {
      (useGlobalFullScreen as jest.Mock).mockReturnValue({
        globalFullScreen: false,
        setGlobalFullScreen: jest.fn(),
      });
      (useTimelineFullScreen as jest.Mock).mockReturnValue({
        timelineFullScreen: true, // <-- true when the active timeline is in full screen mode
        setTimelineFullScreen: jest.fn(),
      });

      const wrapper = render(
        <TestProviders>
          <GraphOverlay Navigation={<div />} scopeId={timelineId} />
        </TestProviders>
      );

      const overlayContainer = wrapper.getByTestId('overlayContainer');
      expect(overlayContainer).toHaveStyleRule('width', '100%');
    });

    test('it clears the graph event id on unmount', () => {
      (useGlobalFullScreen as jest.Mock).mockReturnValue({
        globalFullScreen: false,
        setGlobalFullScreen: jest.fn(),
      });
      (useTimelineFullScreen as jest.Mock).mockReturnValue({
        timelineFullScreen: true,
        setTimelineFullScreen: jest.fn(),
      });

      const wrapper = render(
        <TestProviders
          store={createMockStore({
            ...mockGlobalState,
            timeline: {
              ...mockGlobalState.timeline,
              timelineById: {
                [timelineId]: {
                  ...mockGlobalState.timeline.timelineById[timelineId],
                  graphEventId: 'test_id',
                },
              },
            },
          })}
        >
          <GraphOverlay Navigation={<div />} scopeId={timelineId} />
        </TestProviders>
      );
      wrapper.unmount();
      expect(mockDispatch).toHaveBeenCalledWith({
        payload: { id: 'timeline-1', graphEventId: '' },
        type: 'x-pack/security_solution/local/timeline/UPDATE_TIMELINE_GRAPH_EVENT_ID',
      });
    });
  });
});
