
import DynamicTable from '@atlaskit/dynamic-table';
import { Column, Grid, Row } from '@collabsoft-net/components';
import React, { useEffect, useState } from 'react';
import kernel from 'API/kernel';
import { RestClientService } from 'API/services/RestClientService';
import Injectables from 'API/Injectables';
import { AppDTO } from 'API/dto/AppDTO';
import { HeadType, RowType } from '@atlaskit/dynamic-table/dist/types/types';
import Avatar from '@atlaskit/avatar';
import CheckIcon from '@atlaskit/icon/glyph/check';
import SearchIcon from '@atlaskit/icon/glyph/search';
import { camelCase } from '@collabsoft-net/helpers';
import Textfield from '@atlaskit/textfield';
import { colors } from '@atlaskit/theme';
import Spinner from '@atlaskit/spinner';
import Select from '@atlaskit/select';
import { Field } from '@atlaskit/form';

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

const hostingOptions = [
  { label: 'All', value: '' },
  { label: 'Only Cloud', value: 'cloud' },
  { label: 'Multiple platforms', value: 'p2' }
];

const paymentOptions = [
  { label: 'All', value: '' },
  { label: 'Paid', value: 'paid' },
  { label: 'Free', value: 'free' },
];

const hostOptions = [
  { label: 'All', value: '' },
  { label: 'Jira', value: 'Jira' },
  { label: 'Confluence', value: 'Confluence' },
];

export const ForgeApps = () => {

  const [ service ] = useState(kernel.get<RestClientService>(Injectables.RestClientService));
  const [ apps, setApps ] = useState<Array<AppDTO>>([]);
  const [ displayedApps, setDisplayedApps ] = useState<Array<AppDTO>>([]);
  const [ isLoading, setLoading ] = useState<boolean>(true);

  const [ filter, setFilter ] = useState<string>();
  const [ host, setHost ] = useState<string>('');
  const [ hosting, setHosting ] = useState<string>('');
  const [ payment, setPayment ] = useState<string>('');

  useEffect(() => {
    service?.findAll<AppDTO>(AppDTO).then(({ values }) => setApps(values)).finally(() => setLoading(false));
  }, [ service ])

  useEffect(() => {
    if (apps) {
      let result = apps.slice();

      if (filter && filter.length > 0) {
        result = result.filter(item => 
          item.name.toLocaleLowerCase().includes(filter) ||
          item.partner.name.toLocaleLowerCase().includes(filter)
        )
      }

      if (host && host.length > 0) {
        result = result.filter(item => (item.host as Array<string>).includes(host.toLocaleLowerCase()));
      }

      if (hosting && hosting.length > 0) {
        result = result.filter(item => hosting === 'cloud' ? item.hosting.length === 1 : item.hosting.length > 1);
      }

      if (payment && payment.length > 0) {
        result = result.filter(item => payment === 'paid' ? item.isPaid : !item.isPaid)
      }

      setDisplayedApps(result);
    }
  }, [ apps, filter, host, hosting, payment ]);

  return (
    <Grid fluid padding="16px 20px">
      <Row>
        <Grid fluid vertical>
          <Column margin='0 8px 0 0'>
            <Field name='search' label='Search'>
              {() => 
                <Textfield 
                  value={ filter }
                  placeholder='By name or partner'
                  onChange={ ({ currentTarget: { value }}) => setFilter(value) }
                  elemAfterInput={ <div style={{ marginRight: '8px' }}><SearchIcon primaryColor={ colors.N300 } label='search' size='small' /></div> }
                  isDisabled={ isLoading } />
              }
            </Field>
          </Column>
          <Column width='150px' margin='0 8px 0 0'>
            <Field name='host' label='Host'>
              {() => <Select options={ hostOptions } value={ hostOptions.find(item => item.value === host) } onChange={ (item) => item && setHost(item.value) } isDisabled={ isLoading } /> }
            </Field>
          </Column>
          <Column width='150px' margin='0 8px 0 0'>
            <Field name='payment' label='Payment model'>
              {() => <Select options={ paymentOptions } value={ paymentOptions.find(item => item.value === payment) } onChange={ (item) => item && setPayment(item.value) } isDisabled={ isLoading } /> }
            </Field>
          </Column>
          <Column width='150px' margin='0 8px 0 0'>
            <Field name='hosting' label='Hosting'>
              {() => <Select options={ hostingOptions } value={ hostingOptions.find(item => item.value === hosting) } onChange={ (item) => item && setHosting(item.value) } isDisabled={ isLoading } /> }
            </Field>
          </Column>
          <Column stretched></Column>
          <Column padding='30px 0 0 0' height='40px' align='center'>
            { isLoading 
              ? <Spinner /> 
              : displayedApps.length !== apps.length 
                ? <>Showing {displayedApps.length} out of {apps.length} Forge apps</> 
                : <>{apps.length} Forge apps listed</>
            }
          </Column>
        </Grid>
      </Row>
      <Row margin="12px 0">
        <DynamicTable
          head={ createHead() }
          rows={ createRows(displayedApps) }
          emptyView={ <span>There are no Forge apps available</span> }
          isLoading={ isLoading }
          rowsPerPage={50}
          defaultPage={1}
          />
      </Row>
    </Grid>
  );
}