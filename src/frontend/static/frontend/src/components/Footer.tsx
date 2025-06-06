import React from 'react'
import { Container, Grid, Icon, Segment } from 'semantic-ui-react'

declare const multiomixVersion: string
declare const urlSitePolicy: string

export const Footer = () => {
    return (
        <Segment id='footer' inverted vertical>
            <Container>
                <Grid divided inverted stackable textAlign='center'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <p>
                                <a id='site-policy-link' href='https://omicsdatascience.org/' rel='noreferrer' target='_blank'>OmicsDataScience</a> | Multiomix v{multiomixVersion} <a id='site-policy-link' href='https://github.com/omics-datascience/multiomix' rel='noreferrer' target='_blank'><Icon name='github' link /></a> | <a id='site-policy-link' rel='noreferrer' href={urlSitePolicy}>Terms and privacy policy</a>
                            </p>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>
        </Segment>
    )
}
