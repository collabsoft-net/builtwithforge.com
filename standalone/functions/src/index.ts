import './environment';
import 'reflect-metadata';
import 'source-map-support/register';
import './controllers';

import { createAppServer, registerPubSubHandlers } from '@collabsoft-net/functions';
import * as Sentry from '@sentry/node';
import * as functions from 'firebase-functions';
import { RuntimeOptions } from 'firebase-functions';
import { log } from 'firebase-functions/lib/logger';

import { container } from './inversify.config';

if (process.env.SENTRY_DSN) {
  log('Initializing Sentry', { dsn: process.env.SENTRY_DSN })
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

const runtimeOptions: RuntimeOptions = {
  memory: '512MB',
  timeoutSeconds: 300,
  vpcConnector: process.env.GCLOUD_PROJECT,
  vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY'
};

export const app = functions.runWith(runtimeOptions).https.onRequest(createAppServer(container));

registerPubSubHandlers(container, { ...runtimeOptions, timeoutSeconds: 540 });
