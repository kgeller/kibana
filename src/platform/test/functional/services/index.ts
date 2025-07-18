/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { commonFunctionalUIServices } from '@kbn/ftr-common-functional-ui-services';
import { commonFunctionalServices } from '@kbn/ftr-common-functional-services';

import { AppsMenuService } from './apps_menu';
import {
  FailureDebuggingProvider,
  PngService,
  ScreenshotsService,
  SnapshotsService,
} from './common';
import { ComboBoxService } from './combo_box';
import { SelectableService } from './selectable';
import {
  DashboardAddPanelService,
  DashboardExpectService,
  DashboardPanelActionsService,
  DashboardCustomizePanelProvider,
  DashboardBadgeActionsProvider,
  DashboardVisualizationsService,
  DashboardDrilldownPanelActionsProvider,
  DashboardDrilldownsManageProvider,
} from './dashboard';
import { EmbeddingService } from './embedding';
import { FilterBarService } from './filter_bar';
import { FlyoutService } from './flyout';
import { GlobalNavService } from './global_nav';
import { InspectorService } from './inspector';
import { FieldEditorService } from './field_editor';
import { ManagementMenuService } from './management';
import { QueryBarService } from './query_bar';
import { RenderableService } from './renderable';
import { DataGridService } from './data_grid';
import {
  PieChartService,
  ElasticChartService,
  VegaDebugInspectorViewService,
} from './visualizations';
import { ListingTableService } from './listing_table';
import { SavedQueryManagementComponentService } from './saved_query_management_component';
import { KibanaSupertestProvider } from './supertest';
import { MenuToggleService } from './menu_toggle';
import { MonacoEditorService } from './monaco_editor';
import { UsageCollectionService } from './usage_collection';
import { SavedObjectsFinderService } from './saved_objects_finder';
import { DashboardSettingsProvider } from './dashboard/dashboard_settings';
import { ESQLService } from './esql';
import { DataViewsService } from './data_views';
import { SynthtraceClientProvider } from './synthtrace/sythtrace';

export const services = {
  ...commonFunctionalServices,
  ...commonFunctionalUIServices,
  filterBar: FilterBarService,
  queryBar: QueryBarService,
  png: PngService,
  screenshots: ScreenshotsService,
  snapshots: SnapshotsService,
  failureDebugging: FailureDebuggingProvider,
  listingTable: ListingTableService,
  dashboardVisualizations: DashboardVisualizationsService,
  dashboardExpect: DashboardExpectService,
  dashboardAddPanel: DashboardAddPanelService,
  dashboardPanelActions: DashboardPanelActionsService,
  dashboardCustomizePanel: DashboardCustomizePanelProvider,
  dashboardBadgeActions: DashboardBadgeActionsProvider,
  dashboardDrilldownPanelActions: DashboardDrilldownPanelActionsProvider,
  dashboardDrilldownsManage: DashboardDrilldownsManageProvider,
  dashboardSettings: DashboardSettingsProvider,
  dataViews: DataViewsService,
  flyout: FlyoutService,
  comboBox: ComboBoxService,
  selectable: SelectableService,
  dataGrid: DataGridService,
  embedding: EmbeddingService,
  renderable: RenderableService,
  pieChart: PieChartService,
  inspector: InspectorService,
  fieldEditor: FieldEditorService,
  vegaDebugInspector: VegaDebugInspectorViewService,
  appsMenu: AppsMenuService,
  globalNav: GlobalNavService,
  savedQueryManagementComponent: SavedQueryManagementComponentService,
  elasticChart: ElasticChartService,
  supertest: KibanaSupertestProvider,
  managementMenu: ManagementMenuService,
  monacoEditor: MonacoEditorService,
  menuToggle: MenuToggleService,
  usageCollection: UsageCollectionService,
  savedObjectsFinder: SavedObjectsFinderService,
  esql: ESQLService,
  synthtrace: SynthtraceClientProvider,
};
