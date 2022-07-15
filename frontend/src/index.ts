import 'arrive';
import 'reflect-metadata';

import { Injectables } from 'API/Injectables';
import kernel from 'API/kernel';
import ReactDOM from 'react-dom';

import { EntryPoint, Props } from './interfaces';
import { config } from './kernel.config';

interface ExtendedDocument extends Document {
  arrive: (selector: string, callback: (rootElem: Element) => Promise<void>) => void;
}

export const modules = config;

const bind = async (entrypoint: EntryPoint<Props>, rootElem: Element, callback?: () => void) => {
  const selector = entrypoint.selector || `#${entrypoint.name}`;
  rootElem = rootElem || document.querySelector(selector);
  const props = {} as Props;

  rootElem
    .getAttributeNames()
    .filter((attributeName) => attributeName.startsWith('data'))
    .forEach((attributeName) => {
      const name = attributeName.substring(5);
      const value = rootElem.getAttribute(attributeName);
      if (value) {
        if (name === 'state' || name === 'mockstate') {
          const decoded = Buffer.from(value, 'base64').toString('utf-8');
          props[name] = JSON.parse(decoded);
        } else {
          props[name] = value;
        }
      }
    });

  const element = await (<EntryPoint<Props>>entrypoint).getElement(props);
  ReactDOM.render(element, rootElem, () => {
    if (callback) callback();
  });
};

export const render = async (callback?: () => void): Promise<void> => {

  // Initialize bindings
  await kernel.build();

  // Get all modules
  const modules: Array<EntryPoint<Props>> = kernel.getAll(Injectables.EntryPoint);

  // Register application entrypoints for rendering
  modules.forEach((entrypoint) => {
    const selector = entrypoint.selector || `#${entrypoint.name}`;

    // Prevent a page load race condition by checking if the element already exists
    const rootElm = document.querySelector(selector);
    if (rootElm) {
      bind(entrypoint, rootElm, callback);
    } else {
      (document as ExtendedDocument).arrive(selector, async (rootElem: Element) => {
        await bind(entrypoint, rootElem, callback);
      });
    }
  });
};