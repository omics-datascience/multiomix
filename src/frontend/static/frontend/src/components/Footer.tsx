import React from 'react'
import { Container, Grid, Icon, Segment } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

declare const multiomixVersion: string
declare const urlSitePolicy: string

/**
 * Site's footer.
 * @returns Component.
 */
export const Footer = () => {
    const intl = useIntl()
    return (
        <Segment id='footer-component' inverted vertical>
            <Container>
                <Grid divided inverted stackable textAlign='center'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <p>
                                <a
                                    className='hover-link'
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
                                    className='hover-link'
                                >
                                    <Icon name='github' link />
                                </a>{' '}
                                |{' '}
                                <a
                                    className='hover-link'
                                    href={urlSitePolicy}
                                    rel='noreferrer'
                                >
                                    {intl.formatMessage({
                                        id: 'footer.termsAndPrivacyPolicy'
                                    })}
                                </a>
                            </p>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>
        </Segment>
    )
}
