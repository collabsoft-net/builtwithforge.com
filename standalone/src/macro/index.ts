import 'reflect-metadata';
import '@atlaskit/css-reset/dist/bundle.css';

import { AbstractRestClient } from '@collabsoft-net/clients';
import { typeMappings } from 'API/constants/typeMappings';
import Injectables from 'API/Injectables';
import kernel, { BindingLifecyclePhases } from 'API/kernel';
import { RestClientService } from 'API/services/RestClientService';
import { ContainerModule, interfaces } from 'inversify';
import { modules, render } from 'UI';

import { createPlaceholder, resizeFix, waitForAP } from './bootloader';

waitForAP().then(() =>
  kernel
    .registerHook(BindingLifecyclePhases.INIT, new ContainerModule((bind: interfaces.Bind) => {
      bind<RestClientService>(Injectables.RestClientService).toConstantValue(new RestClientService(new class RestClient extends AbstractRestClient {}('/api'), typeMappings));
    }))
    .registerHook(BindingLifecyclePhases.API_LOADED, modules)
    .build()
).then(() => render()).then(() => createPlaceholder()).then(() => resizeFix());