/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../../ftr_provider_context';

type TestingModes = 'snapshot' | 'savedObject';
type AppState = string | undefined;
interface UrlState {
  globalState: string;
  appState: AppState;
}

const getStateFromUrl = (url: string): UrlState => {
  const globalStateStart = url.indexOf('_g');
  const appStateStart = url.indexOf('_a');

  // global state is always part of the URL, but app state is *not* - so, need to
  // modify the logic depending on whether app state exists or not
  if (appStateStart === -1) {
    return {
      globalState: url.substring(globalStateStart + 3),
      appState: undefined,
    };
  }
  return {
    globalState: url.substring(globalStateStart + 3, appStateStart - 1),
    appState: url.substring(appStateStart + 3, url.length),
  };
};

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const retry = getService('retry');
  const filterBar = getService('filterBar');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const dashboardPanelActions = getService('dashboardPanelActions');
  const dashboardCustomizePanel = getService('dashboardCustomizePanel');

  const { dashboard, common, share } = getPageObjects(['dashboard', 'common', 'share']);

  const getSharedUrl = async (mode: TestingModes): Promise<string> => {
    await retry.waitFor('share menu to open', async () => {
      await share.clickShareTopNavButton();
      return await share.isShareMenuOpen();
    });
    return await share.getSharedUrl();
  };

  const unpinnedFilterIsOnlyWhenDashboardIsUnsaved = async (mode: TestingModes) => {
    await filterBar.addFilter({ field: 'geo.src', operation: 'is', value: 'AE' });
    await dashboard.waitForRenderComplete();

    const sharedUrl = await getSharedUrl(mode);
    const { globalState, appState } = getStateFromUrl(sharedUrl);
    expect(globalState).to.not.contain('filters');
    if (mode === 'snapshot') {
      expect(appState).to.contain('filters');
    } else {
      expect(sharedUrl).to.not.contain('appState');
    }
  };

  const unpinnedFilterIsRemoved = async (mode: TestingModes) => {
    await dashboard.clickQuickSave();
    await dashboard.waitForRenderComplete();

    const sharedUrl = await getSharedUrl(mode);
    expect(sharedUrl).to.not.contain('appState');
  };

  const pinnedFilterIsWhenDashboardInGlobalState = async (mode: TestingModes) => {
    await filterBar.toggleFilterPinned('geo.src');
    await dashboard.clickQuickSave();
    await dashboard.waitForRenderComplete();

    const sharedUrl = await getSharedUrl(mode);
    const { globalState, appState } = getStateFromUrl(sharedUrl);
    expect(globalState).to.contain('filters');
    if (mode === 'snapshot') {
      expect(appState).to.not.contain('filters');
    }
  };

  describe('share dashboard', () => {
    before(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/dashboard/current/kibana'
      );
      await kibanaServer.uiSettings.replace({
        defaultIndex: '0bf35f60-3dc9-11e8-8660-4d65aa086b3c',
      });
      const from = 'Sep 19, 2017 @ 06:31:44.000';
      const to = 'Sep 23, 2018 @ 18:31:44.000';
      await common.setTime({ from, to });
      await dashboard.navigateToApp();
      await dashboard.preserveCrossAppState();
      await dashboard.loadSavedDashboard('few panels');
      await dashboard.switchToEditMode();
      await dashboard.waitForRenderComplete();
    });

    after(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await common.unsetTime();
    });

    describe('snapshot share', () => {
      describe('test local state', () => {
        it('should not have "panels" state when not in unsaved changes state', async () => {
          await testSubjects.missingOrFail('dashboardUnsavedChangesBadge');
          expect(await getSharedUrl('snapshot')).to.not.contain('panels');
        });

        it('should have "panels" in app state when a panel has been modified', async () => {
          await dashboardPanelActions.customizePanel();
          await dashboardCustomizePanel.setCustomPanelTitle('Test New Title');
          await dashboardCustomizePanel.clickSaveButton();
          await dashboard.waitForRenderComplete();
          await testSubjects.existOrFail('dashboardUnsavedChangesBadge');

          const sharedUrl = await getSharedUrl('snapshot');
          const { appState } = getStateFromUrl(sharedUrl);
          expect(appState).to.contain('panels');
        });

        it('should once again not have "panels" state when save is clicked', async () => {
          await dashboard.clickQuickSave();
          await dashboard.waitForRenderComplete();
          await testSubjects.missingOrFail('dashboardUnsavedChangesBadge');
          expect(await getSharedUrl('snapshot')).to.not.contain('panels');
        });
      });

      describe('test filter state', () => {
        const mode = 'snapshot';

        it('should not have "filters" state in either app or global state when no filters', async () => {
          expect(await getSharedUrl(mode)).to.not.contain('filters');
        });

        it('unpinned filter should show up only in app state when dashboard is unsaved', async () => {
          await unpinnedFilterIsOnlyWhenDashboardIsUnsaved(mode);
        });

        it('unpinned filters should be removed from app state when dashboard is saved', async () => {
          await unpinnedFilterIsRemoved(mode);
        });

        it('pinned filter should show up only in global state', async () => {
          await pinnedFilterIsWhenDashboardInGlobalState(mode);
        });
      });

      after(async () => {
        await filterBar.removeAllFilters();
        await dashboard.clickQuickSave();
        await dashboard.waitForRenderComplete();
      });
    });

    describe('saved object share', () => {
      describe('test filter state', () => {
        const mode = 'savedObject';

        it('should not have "filters" state in either app or global state when no filters', async () => {
          expect(await getSharedUrl(mode)).to.not.contain('filters');
        });

        it('unpinned filter should show up only in app state when dashboard is unsaved', async () => {
          await unpinnedFilterIsOnlyWhenDashboardIsUnsaved(mode);
        });

        it('unpinned filters should be removed from app state when dashboard is saved', async () => {
          await unpinnedFilterIsRemoved(mode);
        });

        it('pinned filter should show up only in global state', async () => {
          await pinnedFilterIsWhenDashboardInGlobalState(mode);
        });
      });
    });
  });
}
