import { modules } from 'API/constants/Modules';
import { Injectables } from 'API/Injectables';
import { ContainerModule, interfaces } from 'inversify';
import React from 'react';

import { EntryPoint, Props } from './interfaces';

export const config = new ContainerModule((bind: interfaces.Bind) => {
  Object.values(modules).forEach(entryPointName => {
    bind<EntryPoint<Props>>(Injectables.EntryPoint).toConstantValue({
      name: entryPointName,
      getElement: async (props: Props) => {
        const { [ entryPointName ]: ModuleComponent } = (await import(/* webpackChunkName: "[request]" */ `./modules/${entryPointName}`));
        return <ModuleComponent {...props} />;
      }
    });
  });

});