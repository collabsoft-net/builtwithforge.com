import { Repository } from '@collabsoft-net/types';
import { injectable } from 'inversify';

import { BasePaths } from '../enums/BasePaths';
import { AppService } from './AppService';

@injectable()
export class RawAppService extends AppService {

  static getInstance(repository: Repository): RawAppService {
    return new RawAppService(repository, { path: `${BasePaths.RAWAPPS}` });
  }

}
