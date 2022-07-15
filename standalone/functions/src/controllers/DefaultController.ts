import { AbstractController } from '@collabsoft-net/controllers';
import { controller, httpGet } from 'inversify-express-utils';
import { StatusCodeResult } from 'inversify-express-utils/lib/results';

@controller('/api')
export class DefaultController extends AbstractController<ForgeSession> {

  @httpGet('/')
  async getDefaultEndpoint(): Promise<StatusCodeResult> {
    return this.statusCode(200);
  }

}