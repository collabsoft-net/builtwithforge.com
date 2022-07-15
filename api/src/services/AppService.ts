import { AbstractService } from '@collabsoft-net/services';
import { QueryOptions, Repository } from '@collabsoft-net/types';
import { Validator } from '@collabsoft-net/types';
import { injectable } from 'inversify';

import { AppDTO } from '../dto/AppDTO';
import { App } from '../entities/App';
import { BasePaths } from '../enums/BasePaths';

@injectable()
export class AppService extends AbstractService<App, AppDTO> {

  constructor(repository: Repository, options: QueryOptions) {
    super(repository, options);
  }

  toDTO(entity: App): AppDTO {
    return new AppDTO(entity);
  }

  // TODO: consider adding validation for Apps
  isValidEntity(): boolean {
    return true;
  }

  async save(entity: App | AppDTO): Promise<App> {
    return await super.save(<App>entity);
  }

  static getInstance(repository: Repository): AppService {
    return new AppService(repository, { path: `${BasePaths.APPS}` });
  }

  protected get validators(): Array<Validator> {
    return [];
  }

}
