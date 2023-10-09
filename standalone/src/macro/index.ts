import 'reflect-metadata';
import '@atlaskit/css-reset/dist/bundle.css';

import { AbstractRestClient } from '@collabsoft-net/clients';
import { CachingService } from '@collabsoft-net/types';
import { typeMappings } from 'API/constants/typeMappings';
import Injectables from 'API/Injectables';
import kernel, { BindingLifecyclePhases } from 'API/kernel';
import { RestClientService } from 'API/services/RestClientService';
import { AxiosRequestConfig } from 'axios';
import { ContainerModule, interfaces } from 'inversify';
import { modules, render } from 'UI';

import { createPlaceholder, resizeFix, waitForAP } from './bootloader';

waitForAP().then(() =>
  kernel
  .registerHook(BindingLifecyclePhases.INIT, new ContainerModule((bind: interfaces.Bind) => {
    bind<RestClientService>(Injectables.RestClientService).toConstantValue(new RestClientService(
      new (class RestClient extends AbstractRestClient {
        constructor(baseUrl: string, config?: AxiosRequestConfig, cacheService?: CachingService | undefined, cacheDuration?: number) {
          super(baseUrl, config, cacheService, cacheDuration);
        }

        cached(duration: number) {
          return new RestClient(this.baseURL, this.config, this.cacheService, duration);
        }

      })('/api'),
      typeMappings
    ));
  }))
  .registerHook(BindingLifecyclePhases.API_LOADED, modules)
  .build()
).then(() => render()).then(() => createPlaceholder()).then(() => resizeFix());