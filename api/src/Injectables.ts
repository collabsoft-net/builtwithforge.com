
const Injectables = {
  AP: Symbol.for('AP'),
  Mode: Symbol.for('Mode'),
  Repository: Symbol.for('Repository'),
  EntryPoint: Symbol.for('EntryPoint'),

  RestClientService: Symbol.for('RestClientService')
};

export default Injectables;
export { Injectables };
