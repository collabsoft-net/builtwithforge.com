import { DTO, Type } from '@collabsoft-net/types';

import { AppDTO } from '../dto/AppDTO';

export const typeMappings = new Map<string, Type<DTO>>([
  [ 'apps', AppDTO ]
]);