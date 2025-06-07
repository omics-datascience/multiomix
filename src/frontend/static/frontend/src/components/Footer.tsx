import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Container, Grid, Icon, Segment } from 'semantic-ui-react'

declare const multiomixVersion: string
declare const urlSitePolicy: string

export const Footer = () => {

    const [footerEl, setFooterEl] = useState<HTMLElement | null>(null)

    useEffect(() => {
        setFooterEl(document.getElementById('footer'))
    }, [])

    if (!footerEl) return null

    const content = (
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
    return createPortal(content, footerEl)

}
