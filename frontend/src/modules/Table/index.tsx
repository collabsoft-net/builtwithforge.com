import { Grid, Page, Row } from '@collabsoft-net/components';
import React from 'react';
import { ForgeApps } from "../../components/Molecules/ForgeApps";

export const Table = () => (
  <Page padding='40px 0'>
    <Grid fluid padding="0 20px">
      <Row>
        <ForgeApps />
      </Row>
    </Grid>
  </Page>
);