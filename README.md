# Built with Forge

This project generates a list of Atlassian Marketplace apps specifically filtered for being developed using Atlassian Forge.

## How to run it locally

### Prerequisites

In order to run this project locally you will need to have Git, NodeJS and Yarn installed.

In addition, it uses Firebase and ElasticSearch for database and search respectively. This means that you will need to either configure local GCP firestore emulators or create a Firebase project and have an ElasticSearch instance running.

At this point the project is also configured to use NGrok with a custom subdomain. It is using Greenlock to provision a Letsencrypt certificate on AWS Route53.

This set-up is a result of our internal development process, which has been highly influenced by Atlassian app development (which requires NGrok and https). Although it is not necessarily required for this project, and might create a barrier for contributing or running it locally, this is just what works best for us.

We are open to discuss alternatives in an issue and are open to review a PR which creates a more stand-alone solution. We're just not going to put the time & effort in this ourselves.

#### Environment variables

Create a file called `local.json` with the following environment variables:

```
{
  "NODE_ENV": "STAGING",

  "AC_BASEURL": "",
  "LICENSING_ENABLED": "false",
  
  "NGROK_SUBDOMAIN": "",
  "NGROK_AUTHTOKEN": "",
  "AWS_ACCESS_KEY_ID": "",
  "AWS_SECRET_ACCESS_KEY": "",

  "SEARCH_URL": "",
  "SEARCH_TOKEN": "",
  "INDEX_TOKEN": "",

  "FB_PROJECTID": ""
}
```

The `NGROK_SUBDOMAIN`, `NGROK_AUTHTOKEN`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are required to connect the project to NGrok, run on a custom subdomain and provision the Letsencrypt certificate using DNS verification with Route53.

The `SEARCH_URL`, `SEARCH_TOKEN` and `INDEX_TOKEN` are to connect the project to ElasticSearch app search.

The `FB_PROJECTID` is the Firebase project ID (the project assumes that you are logged in to Firebase locally).

## Starting the application

Clone the repository from Github, run `yarn` to install all dependencies, make sure the `local.json` is available in the root of the project and run:

```
yarn start-standalone
```

Afterwards, the application will be available from `https://<NGROK_SUBDOMAIN>`.

## Populating the database & app search

When you start the application for the first time, the results table will be empty.

The application has a scheduled task to pull data from the Atlassian Marketplace and populate the database and app search instance, which is set to run on a cron schedule of `0 0 * * *`. You can change the cron schedule in `standalone/functions/src/scheduledTasks/ImportAppsScheduledTask.ts` in order to have it run more frequently during local development.

## Contributions

As alluded before, this application was built based on development practices that we use in our Atlassian app development business. That means that it is highly opinionated and might be counterintuitive, making it difficult to contribute.

However, we are more than welcome to accept contributions, in any shape or form. This can be feature suggestions or bug reports using Github issues or actual code changes through Pull Requests.

## License & other legal stuff

Licensed under the Apache License, Version 2.0 (the "License"); You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

### Important usage notice

The code in this project relies heavily on other 3rd party Open Source projects, installed through npm/yarn. These projects all have their own licenses. Although commercial use of the code in this project is permitted under the Apache 2.0 license, this right is limited to the "original content" created as part of this project. Please make sure you check the licenses of all 3rd party components. Collabsoft cannot be held responsible for non-compliance with 3rd party licenses when using the packages or source code. The use of 3rd party projects is listed in the dependency section of the package.json or inline in the code (when applicable).
