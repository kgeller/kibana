/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const security = getService('security');
  const retry = getService('retry');
  const { common, discover, unifiedFieldList } = getPageObjects([
    'common',
    'discover',
    'unifiedFieldList',
  ]);

  describe('index pattern with unmapped fields', () => {
    before(async () => {
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/unmapped_fields'
      );
      await kibanaServer.savedObjects.clean({ types: ['search', 'index-pattern'] });
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/unmapped_fields'
      );
      await security.testUser.setRoles(['kibana_admin', 'test-index-unmapped-fields']);
      const fromTime = '2021-01-20T00:00:00.000Z';
      const toTime = '2021-01-25T00:00:00.000Z';

      await kibanaServer.uiSettings.replace({
        defaultIndex: 'test-index-unmapped-fields',
        'timepicker:timeDefaults': `{ "from": "${fromTime}", "to": "${toTime}"}`,
      });

      await common.navigateToApp('discover');
      await discover.selectIndexPattern('test-index-unmapped-fields');
    });

    after(async () => {
      await esArchiver.unload('src/platform/test/functional/fixtures/es_archiver/unmapped_fields');
      await kibanaServer.savedObjects.clean({ types: ['search', 'index-pattern'] });
      await kibanaServer.uiSettings.unset('defaultIndex');
      await kibanaServer.uiSettings.unset('timepicker:timeDefaults');
    });

    it('unmapped fields exist on a new saved search', async () => {
      const expectedHitCount = '4';
      await retry.try(async function () {
        expect(await discover.getHitCount()).to.be(expectedHitCount);
      });
      let allFields = await unifiedFieldList.getAllFieldNames();
      // message is a mapped field
      expect(allFields.includes('message')).to.be(true);
      // sender is not a mapped field
      expect(allFields.includes('sender')).to.be(false);

      await unifiedFieldList.toggleSidebarSection('unmapped');

      allFields = await unifiedFieldList.getAllFieldNames();
      expect(allFields.includes('sender')).to.be(true); // now visible under Unmapped section

      await unifiedFieldList.toggleSidebarSection('unmapped');
    });

    it('unmapped fields exist on an existing saved search', async () => {
      await discover.loadSavedSearch('Existing Saved Search');
      const expectedHitCount = '4';
      await retry.try(async function () {
        expect(await discover.getHitCount()).to.be(expectedHitCount);
      });
      let allFields = await unifiedFieldList.getAllFieldNames();
      expect(allFields.includes('message')).to.be(true);
      expect(allFields.includes('sender')).to.be(false);
      expect(allFields.includes('receiver')).to.be(false);

      await unifiedFieldList.toggleSidebarSection('unmapped');

      allFields = await unifiedFieldList.getAllFieldNames();

      // now visible under Unmapped section
      expect(allFields.includes('sender')).to.be(true);
      expect(allFields.includes('receiver')).to.be(true);

      await unifiedFieldList.toggleSidebarSection('unmapped');
    });
  });
}
