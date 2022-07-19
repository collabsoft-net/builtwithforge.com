import { modules } from 'API/constants/modules';

import { Common } from './common'

export const Confluence = {
  ...Common,
  key: 'report.forge.confluence',
  name: 'State of Forge',
  description: 'Your daily updated overview of Forge apps as listed on the Atlassian Marketplace',
  modules: {
    dynamicContentMacros: [{
      key: 'report-forge-overview',
      name: { value: 'State of Forge' },
      width: '100%',
      renderModes: {
        default: {
          url: `/macro/index.html?s=${modules.TABLE}`
        }
      },
      url: `/macro/index.html?s=${modules.TABLE}`,
      description: { value: 'Your daily updated overview of Forge apps as listed on the Atlassian Marketplace' },
      icon: {
        url: '/assets/icon.svg',
        width: 64,
        height: 64
      },
      categories: [
        'external-content',
        'reporting'
      ],
      outputType: 'block',
      bodyType: 'none'
    }]
  }
};
