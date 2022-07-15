
import DynamicTable from '@atlaskit/dynamic-table';
import { Column, Grid, Header, Page, Paragraph, Row } from '@collabsoft-net/components';
import React, { useEffect, useState } from 'react';
import kernel from 'API/kernel';
import { RestClientService } from 'API/services/RestClientService';
import Injectables from 'API/Injectables';
import { AppDTO } from 'API/dto/AppDTO';
import { HeadType, RowType } from '@atlaskit/dynamic-table/dist/types/types';
import Avatar from '@atlaskit/avatar';
import CheckIcon from '@atlaskit/icon/glyph/check';
import { camelCase } from '@collabsoft-net/helpers';

const createHead = () => {
  const head: HeadType = {
    cells: []
  };

  head.cells.push({
    key: 'ICON',
    content: '',
    width: 1
  });

  head.cells.push({
    key: 'NAME',
    content: `Name`,
    isSortable: true
  });

  head.cells.push({
    key: 'PARTNER',
    content: `Partner`,
    isSortable: true
  });

  head.cells.push({
    key: 'HOSTING',
    content: `Hosting`,
    isSortable: true
  });

  head.cells.push({
    key: 'HOST',
    content: `Host`,
    isSortable: true
  });

  head.cells.push({
    key: 'PAID',
    content: `Paid via Atlassian`,
    isSortable: true
  });

  head.cells.push({
    key: 'SCOPES',
    content: `# of Scopes`,
    isSortable: true
  });

  head.cells.push({
    key: 'INSTALLS',
    content: `# of Installs`,
    isSortable: true
  });

  head.cells.push({
    key: 'USERS',
    content: `# of Users`,
    isSortable: true
  });

  return head;
};

const createRows = (apps: Array<AppDTO>) => {
  return apps.map((app) => {
    const row: RowType = {
      key: `row_${app.id}`,
      cells: []
    };

    row.cells.push({
      key: `${app.id}-logo`,
      content: <Avatar size='small' appearance='square' src={ `https://marketplace-cdn.atlassian.com/files/${app.logoId}?fileType=image&mode=full-fit` } />
    });

    row.cells.push({
      key: app.name,
      content: <a href={`https://marketplace.atlassian.com/apps/${app.id}?tab=overview&hosting=cloud`} target="_blank">{app.name}</a>
    });

    row.cells.push({
      key: app.partner.name,
      content: <a href={`https://marketplace.atlassian.com/vendors/${app.partner.id}`} target="_blank">{app.partner.name}</a>
    });

    row.cells.push({
      key: app.hosting.map(item => camelCase(item).replace('Data_center', 'Data Center')).join(', '),
      content: app.hosting.map(item => camelCase(item).replace('Data_center', 'Data Center')).join(', ')
    });

    row.cells.push({
      key: app.host.map(camelCase).join(', '),
      content: app.host.map(camelCase).join(', ')
    });

    row.cells.push({
      key: app.isPaid ? 'true' : 'false',
      content: app.isPaid && <CheckIcon label="Paid via Atlassian" />
    });

    row.cells.push({
      key: app.scopes?.length || 0,
      content: app.scopes?.length || 0
    });

    row.cells.push({
      key: app.distribution?.totalInstalls || 0,
      content: app.distribution?.totalInstalls || 0
    });

    row.cells.push({
      key: app.distribution?.totalUsers || 0,
      content: app.distribution?.totalUsers || 0
    });

    return row;
  });
};

export const Index = () => {

  const [ service ] = useState(kernel.get<RestClientService>(Injectables.RestClientService));
  const [ apps, setApps ] = useState<Array<AppDTO>>([]);
  const [ isLoading, setLoading ] = useState<boolean>(true);

  useEffect(() => {
    service.findAll<AppDTO>(AppDTO).then(({ values }) => setApps(values)).finally(() => setLoading(false));
  }, [ service ])

  return (
    <Page padding='40px 0'>
      <Grid fluid padding="0 20px">
        <Row>
          <Grid>
            <Row>
              <Grid alignItems='center'>
                <Row>
                  <Header weight='h900'>State of Forge</Header>
                </Row>
              </Grid>
            </Row>
            <Row margin="16px 0 0">
              <Paragraph>
                On July 8th, 2022, Atlassian <a href="https://blog.developer.atlassian.com/its-time-to-celebrate-forge-turns-one/" target="_blank">celebrated the first anniversary of Forge</a>, 
                their new platform for creating Cloud apps for the Atlassian product suite. The article highlights a lot of the milestones that the platform has reached during the early stages, 
                including the number of downloads of the CLI and the amount of apps created. 
              </Paragraph>
              <Paragraph>
                Although the target audience for Forge is the broader Atlassian Ecosystem, which includes in-house developers and hobbyists, there is a select group of people that develop apps for a living. 
                The (paid) apps that they create are published to the Atlassian Marketplace. This group is called the Atlassian Marketplace Partners, and they take a special interest in Forge as Atlassian
                has indicated that this will be the preferred platform to create Cloud apps.
              </Paragraph>
              <Paragraph>
                That is why this group is particulairy interested in the progress of Forge, and more specifically, have detailed insights into the current state of forge with regard to commercial exploitation
                of Forge apps. Unfortunately, Atlassian does not provide much information about Forge apps. For instance, it is not possible to filter Forge apps on the Atlassian Marketplace itself.
              </Paragraph>
              <Paragraph>
                Which is why we spent some time creating a more complete overview of the State of Forge, by providing a daily updated list of Forge apps as listed on the Atlassian Marketplace. You can browse
                the list and filter it. The purpose of this list is to provide more insights to power your business decisions.
              </Paragraph>
              <Paragraph>
                <Header weight='h300'>Ok, enough talk, show me the list of Forge apps!</Header>
              </Paragraph>
            </Row>
          </Grid>
        </Row>
        <Row>
          <Grid fluid padding="16px 20px">
            <Row>
              <Grid fluid vertical>
                <Column stretched></Column>
                { !isLoading && (
                  <Column>{apps.length} Forge apps listed</Column>
                )}
              </Grid>
            </Row>
            <Row margin="12px 0">
              <DynamicTable
                head={ createHead() }
                rows={ createRows(apps) }
                emptyView={ <span>There are no Forge apps available</span> }
                isLoading={ isLoading } />
            </Row>
          </Grid>
        </Row>
      </Grid>
    </Page>
  );
}