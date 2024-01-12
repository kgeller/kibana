import './index.scss';

import { CustomIntegrationsPlugin } from './plugin';

export type { CustomIntegrationsPluginSetup, CustomIntegrationsPluginStart } from './plugin';

export const plugin = () => new CustomIntegrationsPlugin();
