import './environment';
import 'reflect-metadata';

import { getFirebaseAdminOptions, ScheduledPubSubHandlers } from '@collabsoft-net/functions';
import { isProduction } from '@collabsoft-net/helpers';
import { FirebaseAdminRepository } from '@collabsoft-net/repositories';
import { Repository, ScheduledPubSubHandler } from '@collabsoft-net/types';
import Injectables from 'API/Injectables';
import { info } from 'firebase-functions/lib/logger';
import { Container } from 'inversify';

import { ImportAppsScheduledTask } from './scheduledTasks/ImportAppsScheduledTask';


if (!isProduction() && process.env.FB_ADMINKEY) {
  info('You are running Firebase Cloud Functions using local environment variables');
}

const container = new Container();

// ------------------------------------------------------------------------------------------ Bindings

// ------------------------------------------------------------------------------------------ Bindings :: API

container.bind<Repository>(Injectables.Repository).toConstantValue(
  new FirebaseAdminRepository(process.env.FB_PROJECTID || 'forge-report', getFirebaseAdminOptions())
);

// ------------------------------------------------------------------------------------------ Bindings :: PubSub Handlers

container.bind<ScheduledPubSubHandler>(ScheduledPubSubHandlers).to(ImportAppsScheduledTask);

// ------------------------------------------------------------------------------------------ Export

export { container };