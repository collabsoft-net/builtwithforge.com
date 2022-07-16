/* eslint-disable @typescript-eslint/no-explicit-any */

import { TenantAwareEvent } from '@collabsoft-net/types';

export class ImportAppEvent implements TenantAwareEvent {

  constructor(
    public tenantId: string,
    public app: any
  ) {}

}
