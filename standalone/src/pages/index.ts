import '@atlaskit/css-reset/dist/bundle.css';
import 'reflect-metadata';

import { AbstractRestClient } from '@collabsoft-net/clients';
import { BindingLifecyclePhases } from '@collabsoft-net/inversify';
import { CachingService } from '@collabsoft-net/types';
import * as Sentry from '@sentry/browser';
import { typeMappings } from 'API/constants/typeMappings';
import Injectables from 'API/Injectables';
import kernel from 'API/kernel';
import { RestClientService } from 'API/services/RestClientService';
import { AxiosRequestConfig } from 'axios';
import { ContainerModule, interfaces } from 'inversify';
import { modules, render } from 'UI';

import { createPlaceholder } from './helpers/bootloader';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

(async () => {

  // Add bindings specifically for use in Standalone mode
  await kernel
    .registerHook(BindingLifecyclePhases.INIT, new ContainerModule((bind: interfaces.Bind) => {
      bind<RestClientService>(Injectables.RestClientService).toConstantValue(new RestClientService(
        new (class RestClient extends AbstractRestClient {
          constructor(baseUrl: string, config?: AxiosRequestConfig, cacheService?: CachingService | undefined, cacheDuration?: number) {
            super(baseUrl, config, cacheService, cacheDuration);
          }

          cached(duration: number) {
            return new RestClient(this.baseURL, this.config, this.cacheService, duration);
          }

        })('/api'), typeMappings));
    }))
    .registerHook(BindingLifecyclePhases.API_LOADED, modules)
    .build();

  // Register UI module listeners
  await render();

  // Attach the module placeholder
  await createPlaceholder();
})();