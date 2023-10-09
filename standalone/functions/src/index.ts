import './environment';
import 'reflect-metadata';
import 'source-map-support/register';
import './controllers';

import { createAppServer, registerPubSubHandlers } from '@collabsoft-net/functions';
import * as Sentry from '@sentry/node';
import * as functions from 'firebase-functions';
import { RuntimeOptions } from 'firebase-functions';
import { logger } from 'firebase-functions';

import { container } from './inversify.config';

if (process.env.SENTRY_DSN) {
  logger.log('Initializing Sentry', { dsn: process.env.SENTRY_DSN })
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

const runtimeOptions: RuntimeOptions = {
  memory: '512MB',
  timeoutSeconds: 300
};

export const app = functions.runWith(runtimeOptions).https.onRequest(createAppServer(container));

registerPubSubHandlers(container, { ...runtimeOptions, timeoutSeconds: 540 });
