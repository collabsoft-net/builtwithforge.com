import { DTO } from '@collabsoft-net/types';

import { App } from '../entities/App';

export class AppDTO extends DTO implements Omit<App, 'id'> {

  name: string;
  key: string;
  active: boolean;
  slug: string;
  summary: string;
  tagline: string;
  createdAt: string;
  categories: Array<string>;
  logoId: string;
  hosting: Array<'CLOUD'|'SERVER'|'DATA_CENTER'>;
  isPaid: boolean;
  host: Array<'confluence'|'jira'>;
  scopes: Array<string>;
  partner: {
    name: string;
    id: string;
    slug: string;
  };
  distribution: {
    totalInstalls: number;
    totalUsers: number;
  }

  constructor(data: App|AppDTO) {
    super(data.id);
    this.name = data.name;
    this.key = data.key;
    this.active = data.active;
    this.slug = data.slug;
    this.summary = data.summary;
    this.tagline = data.tagline;
    this.createdAt = data.createdAt;
    this.categories = data.categories;
    this.logoId = data.logoId;
    this.hosting = data.hosting;
    this.isPaid = data.isPaid;
    this.host = data.host;
    this.scopes = data.scopes;
    this.partner = data.partner;
    this.distribution = data.distribution;
  }
}