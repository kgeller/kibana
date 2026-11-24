/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useMemo, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { map } from 'rxjs';
import { useKibana } from '../../../../../hooks/use_kibana';

export const AUTOMATIC_IMPORT_APP_ID = 'automaticImport';

/** Set when the stream belongs to an integration built with Automatic Import. */
export interface AutomaticImportStreamOwnership {
  packageName?: string;
  integrationId?: string;
  dataStreamId?: string;
}

/** Fetches which Automatic Import integration, if any, owns a stream. */
export const useAutomaticImportOwnership = (
  streamName: string
): AutomaticImportStreamOwnership | undefined => {
  const {
    core: { application, http },
  } = useKibana();

  const isAvailable$ = useMemo(
    () => application.applications$.pipe(map((apps) => apps.has(AUTOMATIC_IMPORT_APP_ID))),
    [application.applications$]
  );
  const isAvailable = useObservable(isAvailable$, false);
  const [ownership, setOwnership] = useState<AutomaticImportStreamOwnership | undefined>();

  useEffect(() => {
    if (!isAvailable) {
      return;
    }
    let isCurrent = true;
    http
      .get<AutomaticImportStreamOwnership>(
        `/api/automatic_import/streams/${encodeURIComponent(streamName)}/ownership`,
        { version: '1' }
      )
      // A 404 means Automatic Import is disabled or does not know this stream; show nothing.
      .catch(() => undefined)
      .then((result) => {
        if (isCurrent) setOwnership(result);
      });
    return () => {
      isCurrent = false;
    };
  }, [http, isAvailable, streamName]);

  return ownership;
};
