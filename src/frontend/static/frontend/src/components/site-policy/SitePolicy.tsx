import React from 'react'
import { Container, Grid, Header, Image } from 'semantic-ui-react'
import { Base } from '../Base'
import { ExternalLink } from '../common/ExternalLink'
import { useIntl } from 'react-intl'

const SitePolicyContent = () => {
    const intl = useIntl()
    return (
        <Container text className='margin-top-2 margin-bottom-5'>
            <Grid stackable>
                {/* Image */}
                <Grid.Row columns={1}>
                    <Grid.Column>
                        <Image
                            rounded
                            centered
                            src='/static/frontend/img/about-us/multiomix-logo-description.png'
                            alt='multiomix-logo-description'
                        />
                    </Grid.Column>
                </Grid.Row>

                {/* Text */}
                <Grid.Row className='margin-bottom-5' columns={1}>
                    <Grid.Column>
                        <Header as='h2' id='site-policy-header'>
                            {intl.formatMessage({ id: 'sitePolicy.header' })}
                        </Header>

                        <p id='site-policy-content'>
                            {intl.formatMessage({ id: 'sitePolicy.authentication' })}

                            <br />

                            {intl.formatMessage({ id: 'sitePolicy.dataTransfer' })}

                            <br />

                            {intl.formatMessage(
                                { id: 'sitePolicy.firewall' },
                                { multiomixLink: 'www.multiomix.org' }
                            )}

                            <br />

                            {intl.formatMessage({ id: 'sitePolicy.containerized' })}

                            <br />

                            {intl.formatMessage({ id: 'sitePolicy.securityMeasures' })}

                            <br />

                            {intl.formatMessage(
                                { id: 'sitePolicy.piiRestriction' },
                                { multiomixLink: 'www.multiomix.org' }
                            )}

                            <br />

                            {intl.formatMessage(
                                { id: 'sitePolicy.localInstance' },
                                { multiomixLink: 'www.multiomix.org' }
                            )}{' '}
                            {intl.formatMessage({ id: 'sitePolicy.localInstanceInstructions' })}{' '}
                            <ExternalLink href='https://github.com/omics-datascience/multiomix/blob/main/DEPLOYING.md'>
                                https://github.com/omics-datascience/multiomix/blob/main/DEPLOYING.md
                            </ExternalLink>
                        </p>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Container>
    )
}

/**
 * Site policy (terms and privacy policy) page
 * @returns Component
 */
export const SitePolicy = () => {
    return (
        <div>
            <Base wrapperClass='wrapper'>
                <SitePolicyContent />
            </Base>
        </div>
    )
}
