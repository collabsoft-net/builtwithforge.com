
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
                <Row margin="16px 0 0">
                  <Paragraph>
                    Your daily updated overview of Forge apps as listed on the Atlassian Marketplace
                  </Paragraph>
                </Row>
              </Grid>
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