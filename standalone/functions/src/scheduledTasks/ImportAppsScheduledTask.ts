/* eslint-disable @typescript-eslint/no-explicit-any */

import { AbstractScheduledPubSubHandler } from '@collabsoft-net/functions';
import { CustomEvent, EventEmitter } from '@collabsoft-net/types';
import { ScheduledTasks,Tasks } from 'API/enums/Events';
import { ImportAppEvent } from 'API/events/ImportAppEvent';
import Injectables from 'API/Injectables';
import axios from 'axios';
import { error, log } from 'firebase-functions/logger';
import { inject, injectable } from 'inversify';

@injectable()
export class ImportAppsScheduledTask extends AbstractScheduledPubSubHandler {

  name = ScheduledTasks.ImportAppsScheduledTask;
  schedule = '0 0 * * *';

  constructor(
    @inject(Injectables.EventEmitter) private eventEmitter: EventEmitter
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      log('==> Retrieving all cloud apps from the Atlassian Marketplace API');
      const apps = await this.getAllCloudApps();

      log(`==> Scheduling ${apps.length} apps for processing`);
      for await (const app of apps) {
        log(`==> Scheduling ${app.id} for processing`);
        await this.eventEmitter.emit(new CustomEvent<ImportAppEvent>(Tasks.ImportAppTask, new ImportAppEvent(app.id, app)));
      }

      log('==> Finished scheduling apps from the Atlassian Marketplace API for processing');
    } catch (err) {
      const { message } = err as Error;
      error('==> Failed to retrieve Cloud apps from the Atlassian Marketplace API', { innerException: message });
    }
  }

  private async getAllCloudApps(url = '/rest/2/addons?hosting=cloud') {
    const apps: Array<any> = [];
    const response = await axios.get(`https://marketplace.atlassian.com/${url}&limit=50`).catch(console.log);
    const result = response?.data;
    if (result) {
      if (result?._links?.next) {
        const next = Array.isArray(result?._links?.next) ? result?._links?.next.find((item: any) => item.type === 'application/json') : result?._links?.next;
        apps.push(...await this.getAllCloudApps(next.href));
      }
      apps.push(...result._embedded?.addons || []);
    }
    return apps;
  }

  protected async timeoutImminent(): Promise<void> {
    // IGNORE THIS FOR NOW
  }

}