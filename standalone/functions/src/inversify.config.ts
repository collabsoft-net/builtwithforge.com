import './environment';
import 'reflect-metadata';

import { PubSubEmitter } from '@collabsoft-net/emitters';
import { getFirebaseAdminOptions, PubSubHandlers, ScheduledPubSubHandlers } from '@collabsoft-net/functions';
import { isProduction } from '@collabsoft-net/helpers';
import { FirebaseAdminRepository } from '@collabsoft-net/repositories';
import { EventEmitter, PubSubHandler, Repository, ScheduledPubSubHandler } from '@collabsoft-net/types';
import Injectables from 'API/Injectables';
import { info } from 'firebase-functions/lib/logger';
import { Container } from 'inversify';

import { ImportAppsScheduledTask } from './scheduledTasks/ImportAppsScheduledTask';
import { ImportAppTask } from './tasks/ImportAppTask';

if (!isProduction() && process.env.FB_ADMINKEY) {
  info('You are running Firebase Cloud Functions using local environment variables');
}

const container = new Container();

// ------------------------------------------------------------------------------------------ Bindings

// ------------------------------------------------------------------------------------------ Bindings :: API

container.bind<Repository>(Injectables.Repository).toConstantValue(
  new FirebaseAdminRepository(process.env.FB_PROJECTID || 'forge-report-app', getFirebaseAdminOptions())
);

container.bind<EventEmitter>(Injectables.EventEmitter).toConstantValue(new PubSubEmitter({
  projectId: process.env.FB_PROJECTID || 'forge-report-app',
  apiKey: process.env.FB_ADMINKEY
}));

// ------------------------------------------------------------------------------------------ Bindings :: Tasks

container.bind<PubSubHandler>(PubSubHandlers).to(ImportAppTask);

// ------------------------------------------------------------------------------------------ Bindings :: Scheduled Tasks

if (isProduction()) {
  container.bind<ScheduledPubSubHandler>(ScheduledPubSubHandlers).to(ImportAppsScheduledTask);
}

// ------------------------------------------------------------------------------------------ Export

export { container };