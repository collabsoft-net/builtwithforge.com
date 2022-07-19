import { isLicensingEnabled } from '@collabsoft-net/helpers';
import { baseUrl } from 'API/constants/baseUrl';

export const Common = {
	apiVersion: 1,
	vendor: {
		name: 'Collabsoft',
		url: 'https://collabsoft.net'
  },
  enableLicensing: isLicensingEnabled(false),
	baseUrl,
	authentication: {
		type: 'none'
  },
  apiMigrations: {
    'context-qsh': true,
    'signed-install': true
  }
};
