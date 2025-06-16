import React, { useEffect, useState } from 'react'
import { Container, Grid, Icon, Segment } from 'semantic-ui-react'

declare const multiomixVersion: string
declare const urlSitePolicy: string

/** Site's footer */
export const Footer = () => {
    return (
        <Segment id='footercomponent' inverted vertical>
          <Container>
            <Grid divided inverted stackable textAlign='center'>
              <Grid.Row columns={1}>
                <Grid.Column>
                  <p>
                    <a
                      className="hover-link"
                      href='https://omicsdatascience.org/'
                      rel='noreferrer'
                      target='_blank'
                    >
                      OmicsDataScience
                    </a>{' '}
                    | Multiomix v{multiomixVersion}{' '}
                    <a
                      href='https://github.com/omics-datascience/multiomix'
                      rel='noreferrer'
                      target='_blank'
                      aria-label='github'
                      className="hover-link"
                    >
                      <Icon name='github' link />
                    </a>{' '}
                    |{' '}
                    <a
                      className="hover-link"
                      href={urlSitePolicy}
                      rel='noreferrer'
                    >
                      Terms and privacy policy
                    </a>
                  </p>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      )
}
