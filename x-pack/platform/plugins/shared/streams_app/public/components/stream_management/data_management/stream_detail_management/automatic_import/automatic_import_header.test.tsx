/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@kbn/i18n-react';
import type { StreamHeaderMenuItem } from '../wrapper';
import { useAutomaticImportHeader } from './automatic_import_header';

const mockHttpGet = jest.fn();
const mockApplications$ = new BehaviorSubject(new Map([['automaticImport', {}]]));
const mockGetUrlForApp = jest.fn(
  (appId: string, { path }: { path: string }) => `/app/${appId}${path}`
);

// useKibana is memoized in the app, so the mock must return a stable object across renders.
const mockKibana = {
  core: {
    http: { get: mockHttpGet },
    application: { applications$: mockApplications$, getUrlForApp: mockGetUrlForApp },
  },
};

jest.mock('../../../../../hooks/use_kibana', () => ({
  useKibana: () => mockKibana,
}));

let menuItems: StreamHeaderMenuItem[] = [];

// Renders the badges, and records the menu items the header would show.
const Header = () => {
  const header = useAutomaticImportHeader('logs-acme.logs-default');
  menuItems = header.menuItems;
  return (
    <div data-test-subj="badges">
      {header.badges.map(({ label, node }) => (
        <span key={label}>{node}</span>
      ))}
    </div>
  );
};

const renderHeader = () =>
  render(
    <I18nProvider>
      <Header />
    </I18nProvider>
  );

describe('useAutomaticImportHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    menuItems = [];
  });

  it('shows an info badge and a Manage integration menu item for an Automatic Import stream', async () => {
    mockHttpGet.mockResolvedValue({
      integrationId: 'acme',
      dataStreamId: 'logs',
      packageName: 'acme',
    });
    renderHeader();

    const badge = await screen.findByTestId('streamsAppAutomaticImportBadge');
    expect(badge).toHaveTextContent('acme integration');
    expect(badge).not.toHaveAttribute('href');
    fireEvent.mouseOver(badge);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Built with Automatic Import');
    expect(menuItems.map(({ label, href }) => ({ label, href }))).toEqual([
      { label: 'Manage integration', href: '/app/automaticImport/edit/acme' },
    ]);
  });

  it('adds nothing for a stream no Automatic Import integration owns, or when the API is missing', async () => {
    mockHttpGet.mockResolvedValueOnce({});
    const { unmount } = renderHeader();
    await waitFor(() => expect(mockHttpGet).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('badges')).toBeEmptyDOMElement();
    expect(menuItems).toEqual([]);
    unmount();

    mockHttpGet.mockRejectedValueOnce(new Error('Not Found'));
    renderHeader();
    await waitFor(() => expect(mockHttpGet).toHaveBeenCalledTimes(2));
    expect(menuItems).toEqual([]);
  });
});
