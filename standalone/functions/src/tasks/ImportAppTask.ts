/* eslint-disable @typescript-eslint/no-explicit-any */

import { CustomEvent, PubSubHandler, Repository } from '@collabsoft-net/types';
import { App } from 'API/entities/App';
import { Tasks } from 'API/enums/Events';
import { ImportAppEvent } from 'API/events/ImportAppEvent';
import Injectables from 'API/Injectables';
import { AppService } from 'API/services/AppService';
import { RawAppService } from 'API/services/RawAppService';
import axios from 'axios';
import { error, log } from 'firebase-functions/logger';
import { pubsub } from 'firebase-functions/v1';
import { inject, injectable } from 'inversify';

@injectable()
export class ImportAppTask implements PubSubHandler {

  name = Tasks.ImportAppTask;
  topic = Tasks.ImportAppTask;

  constructor(
    @inject(Injectables.Repository) private repository: Repository
  ) {}

  async process(message: pubsub.Message): Promise<void> {
    log(`==> Start processing ${this.name}`);
    try {
      const { name, data } = message.json as CustomEvent<ImportAppEvent>;
      if (name !== this.topic) throw new Error(`Event ${name} does not match ${this.topic}, ignoring`);
      await this.run(data.app);
    } catch (err) {
      error('======================== Event processing failed ========================');
      error(`==> Failed to process ${this.name}`, err);
      error('=========================================================================');
    } finally {
      log(`==> Finished processing ${this.name}`);
    }
  }

  async run(app: any) {
    try {
      const appService = AppService.getInstance(this.repository);
      const rawService = RawAppService.getInstance(this.repository);

      log(`==> Retrieving listing details for app ${app.id} from the GraphQL API`);
      const listing = await this.getAppDetails(app.id);
      app.listing = listing;

      if (Array.isArray(listing?.cloudAppVersions?.edges)) {
        const forgeDeployment = listing?.cloudAppVersions?.edges.find((item: any) => item?.node?.deployment?.__typename === 'MarketplaceCloudAppDeployment');
        if (forgeDeployment) {
          app.type = 'forge';
        } else {
          const connectDeployment = listing?.cloudAppVersions?.edges.find((item: any) => item?.node?.deployment?.__typename === 'MarketplaceConnectAppDeployment');
          if (connectDeployment) {
            app.type = 'connect';
          } else {
            app.type = 'unknown';
          }
        }
      }

      log(`==> Persisting source data for app ${app.id} to Firebase`);
      await rawService.save(app);

      if (app.type === 'forge') {
        const entity = this.toAppEntity(app);
        log(`==> Persisting Forge app ${app.id} to Firebase`);
        await appService.save(entity);
      }

      log('==> Finished retrieving Forge apps from the Atlassian Marketplace API');
    } catch (err) {
      const { message } = err as Error;
      error('==> Failed to retrieve Forge apps from the Atlassian Marketplace API', { innerException: message });
    }
  }

  private toAppEntity(app: any): App {
    const result = app.listing?.cloudAppVersions?.edges.find((item: any) => item?.node?.deployment?.__typename === 'MarketplaceCloudAppDeployment');
    const cloudAppVersion = result.node;

    return {
      id: app.id,
      name: app.name,
      key: app.key,
      active: app.listing.entityStatus.toUpperCase() === 'ACTIVE',
      slug: app.listing.slug,
      summary: app.listing.summary,
      tagline: app.listing.tagline,
      createdAt: app.listing.createdAt,
      categories: app.listing.categories.map((item: any) => item.name),
      logoId: app.listing.logo.original.id,
      hosting: app.listing.productHostingOptions,
      isPaid: cloudAppVersion.paymentModel === 'PAID_VIA_ATLASSIAN',
      host: cloudAppVersion.deployment.compatibleProducts?.map((item: any) => item.id) || [],
      scopes: cloudAppVersion.deployment.scopes?.map((item: any) => item.id) || [],
      partner: {
        name: app.listing.partner.name,
        id: app.listing.partner.id,
        slug: app.listing.partner.slug
      },
      distribution: {
        totalInstalls: app._embedded.distribution.totalInstalls,
        totalUsers: app._embedded.distribution.totalUsers,
      }
    };
  }

  private async getAppDetails(appId: string) {
    const response = await axios.post(`https://marketplace.atlassian.com/gateway/api/graphql`, JSON.stringify({
      operationName: 'GetMarketplaceAppListingById',
      query: 'query GetMarketplaceAppListingById($appId: ID!, $location: MarketplaceLocation, $visibility: MarketplaceAppVersionVisibility) {\n  marketplaceApp(appId: $appId) {\n    ...AppListingApp\n    ...PublicPrivateAppVersions\n    ...AllServerDCAppVersionsCount\n    productHostingOptions(excludeHiddenIn: $location)\n    cloudAppVersions: versions(\n      filter: {productHostingOptions: [CLOUD], excludeHiddenIn: $location, visibility: $visibility}\n      first: 1\n    ) {\n      ...AppListingAppVersionConnection\n      __typename\n    }\n    serverAppVersions: versions(\n      filter: {productHostingOptions: [SERVER], excludeHiddenIn: $location, visibility: $visibility}\n      first: 1\n    ) {\n      ...AppListingAppVersionConnection\n      __typename\n    }\n    dataCenterAppVersions: versions(\n      filter: {productHostingOptions: [DATA_CENTER], excludeHiddenIn: $location, visibility: $visibility}\n      first: 1\n    ) {\n      ...AppListingAppVersionConnection\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment AppListingApp on MarketplaceApp {\n  name\n  appKey\n  appId\n  entityStatus\n  slug\n  tagline\n  privacyPolicyUrl\n  listingStatus\n  createdAt\n  marketingLabels\n  googleAnalyticsId\n  summary\n  jsdWidgetKey\n  categories {\n    ...AppListingCategory\n    __typename\n  }\n  wikiUrl\n  forumsUrl\n  isAtlassianCommunityEnabled\n  issueTrackerUrl\n  supportTicketSystemUrl\n  statusPageUrl\n  watchersInfo {\n    ...AppListingWatcherStatus\n    __typename\n  }\n  logo {\n    ...AppListingImage\n    __typename\n  }\n  partner {\n    ...AppListingPartner\n    __typename\n  }\n  reviewSummary {\n    ...AppListingReviewSummary\n    __typename\n  }\n  distribution {\n    ...AppListingDistribution\n    __typename\n  }\n  programs {\n    ...AppListingProgram\n    __typename\n  }\n  __typename\n}\n\nfragment PublicPrivateAppVersions on MarketplaceApp {\n  ...PublicPrivateCloudVersions\n  ...PublicPrivateServerVersions\n  ...PublicPrivateDataCenterVersions\n  __typename\n}\n\nfragment AllServerDCAppVersionsCount on MarketplaceApp {\n  allServerDCAppVersions: versions(\n    filter: {visibility: PUBLIC, productHostingOptions: [SERVER, DATA_CENTER]}\n  ) {\n    totalCount\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingAppVersionConnection on MarketplaceAppVersionConnection {\n  totalCount\n  edges {\n    node {\n      ...AppListingAppVersion\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingCategory on MarketplaceAppCategory {\n  name\n  __typename\n}\n\nfragment AppListingWatcherStatus on MarketplaceAppWatchersInfo {\n  isUserWatchingApp\n  watchersCount\n  __typename\n}\n\nfragment AppListingImage on MarketplaceListingImage {\n  original {\n    id\n    width\n    height\n    __typename\n  }\n  highResolution {\n    id\n    width\n    height\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingPartner on MarketplacePartner {\n  name\n  id\n  slug\n  partnerType\n  programs {\n    isCloudAppSecuritySelfAssessmentDone\n    __typename\n  }\n  partnerTier {\n    type\n    updatedDate\n    __typename\n  }\n  support {\n    contactDetails {\n      websiteUrl\n      ...AppListingPartnerSupportContact\n      __typename\n    }\n    availability {\n      ...AppListingPartnerSupportAvailability\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingReviewSummary on MarketplaceAppReviewSummary {\n  rating\n  count\n  __typename\n}\n\nfragment AppListingDistribution on MarketplaceAppDistribution {\n  downloadCount\n  installationCount\n  isPreinstalledInServerDC\n  isPreinstalledInCloud\n  __typename\n}\n\nfragment AppListingProgram on MarketplaceAppPrograms {\n  cloudFortified {\n    status\n    programStatus\n    __typename\n  }\n  bugBountyParticipant {\n    cloud {\n      status\n      __typename\n    }\n    server {\n      status\n      __typename\n    }\n    dataCenter {\n      status\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment PublicPrivateCloudVersions on MarketplaceApp {\n  publicCloudVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [CLOUD], visibility: PUBLIC}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  privateCloudVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [CLOUD], visibility: PRIVATE}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  __typename\n}\n\nfragment PublicPrivateServerVersions on MarketplaceApp {\n  publicServerVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [SERVER], visibility: PUBLIC}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  privateServerVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [SERVER], visibility: PRIVATE}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  __typename\n}\n\nfragment PublicPrivateDataCenterVersions on MarketplaceApp {\n  publicDataCenterVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [DATA_CENTER], visibility: PUBLIC}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  privateDataCenterVersion: versions(\n    first: 1\n    filter: {productHostingOptions: [DATA_CENTER], visibility: PRIVATE}\n  ) {\n    ...VersionBuildNumber\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingAppVersion on MarketplaceAppVersion {\n  ...AppListingAllAppVersion\n  ...AppListingHostingSelectorAppVersion\n  __typename\n}\n\nfragment AppListingPartnerSupportContact on MarketplacePartnerSupportContact {\n  emailId\n  phoneNumber\n  websiteUrl\n  __typename\n}\n\nfragment AppListingPartnerSupportAvailability on MarketplacePartnerSupportAvailability {\n  daysOfWeek\n  isAvailable24Hours\n  startTime\n  endTime\n  timezone\n  timezoneOffset\n  holidays {\n    ...AppListingPartnerSupportHolidays\n    __typename\n  }\n  __typename\n}\n\nfragment VersionBuildNumber on MarketplaceAppVersionConnection {\n  edges {\n    node {\n      buildNumber\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingAllAppVersion on MarketplaceAppVersion {\n  buildNumber\n  youtubeId\n  moreDetails\n  paymentModel\n  learnMoreUrl\n  endUserLicenseAgreementUrl\n  documentationUrl\n  purchaseUrl\n  isSupported\n  documentationUrl\n  releaseDate\n  releaseNotes\n  releaseSummary\n  releaseNotesUrl\n  version\n  heroImage {\n    ...AppListingImage\n    __typename\n  }\n  highlights {\n    ...AppListingHighlight\n    __typename\n  }\n  screenshots {\n    ...AppListingScreenshot\n    __typename\n  }\n  deployment {\n    ...AppListingAppDeployment\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingHostingSelectorAppVersion on MarketplaceAppVersion {\n  buildNumber\n  paymentModel\n  purchaseUrl\n  learnMoreUrl\n  deployment {\n    ...AppListingAppDeployment\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingPartnerSupportHolidays on MarketplacePartnerSupportHoliday {\n  holidayFrequency\n  date\n  __typename\n}\n\nfragment AppListingHighlight on MarketplaceListingHighlight {\n  title\n  caption\n  summary\n  croppedScreenshot {\n    ...AppListingImage\n    __typename\n  }\n  screenshot {\n    image {\n      ...AppListingImage\n      __typename\n    }\n    caption\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingScreenshot on MarketplaceListingScreenshot {\n  caption\n  image {\n    ...AppListingImage\n    __typename\n  }\n  __typename\n}\n\nfragment AppListingAppDeployment on MarketplaceAppDeployment {\n  __typename\n  compatibleProducts {\n    ...AppListingCompatibleProduct\n    __typename\n  }\n  ... on MarketplaceInstructionalAppDeployment {\n    instructions {\n      instruction\n      screenshot {\n        ...AppListingImage\n        __typename\n      }\n      __typename\n    }\n    isBinaryUrlAvailable\n    __typename\n  }\n  ... on MarketplaceWorkflowAppDeployment {\n    isWorkflowDataFileAvailable\n    __typename\n  }\n  ...ConnectAppScopes\n  ...EcosystemCloudAppDetails\n}\n\nfragment AppListingCompatibleProduct on CompatibleAtlassianProduct {\n  id\n  name\n  __typename\n  atlassianProduct {\n    name\n    hostingOptions\n    __typename\n  }\n  ... on CompatibleAtlassianServerProduct {\n    minimumVersion\n    maximumVersion\n    __typename\n  }\n  ... on CompatibleAtlassianDataCenterProduct {\n    minimumVersion\n    maximumVersion\n    __typename\n  }\n}\n\nfragment ConnectAppScopes on MarketplaceConnectAppDeployment {\n  scopes {\n    id\n    capability\n    __typename\n  }\n  __typename\n}\n\nfragment EcosystemCloudAppDetails on MarketplaceCloudAppDeployment {\n  cloudAppId\n  scopes {\n    id\n    capability\n    __typename\n  }\n  __typename\n}\n',
      variables: { appId, location: 'WEBSITE', visibility: null }
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error);
    return response?.data?.data?.marketplaceApp;
  }

}