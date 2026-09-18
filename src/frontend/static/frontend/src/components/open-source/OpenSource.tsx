import React from 'react'
import { Base } from '../Base'
import { Container, Divider, Grid, Header, HeaderSubheader, List, ListContent, ListDescription, ListHeader, ListIcon, ListItem } from 'semantic-ui-react'
import { FormattedMessage, useIntl } from 'react-intl'

/**
 * Wrapper to make Context.Provider work.
 * @returns Component.
 */
const OpenSourceWrapper = () => {
    const intl = useIntl()
    return (
        <>
            <Container text className='margin-top-2 margin-bottom-5'>
                <Grid stackable>
                    {/* Git hub */}
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h1'>
                                <FormattedMessage
                                    id='openSource.intro.title'
                                    values={{
                                        organizationLink: chunks => <a href='https://omicsdatascience.org/' rel='noreferrer' target='_blank'>{chunks}</a>,
                                        githubLink: chunks => <a href='https://github.com/omics-datascience' rel='noreferrer' target='_blank'>{chunks}</a>
                                    }}
                                />
                            </Header>
                            <HeaderSubheader>
                                {intl.formatMessage({ id: 'openSource.intro.description' })}
                            </HeaderSubheader>
                            <List>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/multiomix' target='_blank'>Multiomix</ListHeader>
                                        <ListDescription>{intl.formatMessage({ id: 'openSource.multiomix.description' })}</ListDescription>
                                    </ListContent>
                                </ListItem>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/modulector' target='_blank'>Modulector</ListHeader>
                                        <ListDescription>{intl.formatMessage({ id: 'openSource.modulector.description' })}</ListDescription>
                                    </ListContent>
                                </ListItem>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/BioAPI' target='_blank'>BioApi</ListHeader>
                                        <ListDescription>{intl.formatMessage({ id: 'openSource.bioapi.description' })}</ListDescription>
                                    </ListContent>
                                </ListItem>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h2'>
                                <FormattedMessage
                                    id='openSource.publications.title'
                                    values={{
                                        contributionsLink: chunks => <a href='https://omicsdatascience.org/?page_id=15' rel='noreferrer' target='_blank'>{chunks}</a>
                                    }}
                                />
                            </Header>
                            <HeaderSubheader>
                                {intl.formatMessage({ id: 'openSource.publications.description' })}
                            </HeaderSubheader>
                            <List>
                                <ListItem>
                                    <ListIcon name='file alternate' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' href='https://omicsdatascience.org/?p=179' rel='noreferrer' target='_blank'>
                                            Multiomix
                                        </ListHeader>
                                        <ListDescription>
                                            {intl.formatMessage({ id: 'openSource.publication.multiomix.description' })}
                                        </ListDescription>
                                    </ListContent>
                                </ListItem>
                                <ListItem>
                                    <ListIcon name='file alternate' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' href='https://omicsdatascience.org/?p=1' rel='noreferrer' target='_blank'>
                                            Modulector
                                        </ListHeader>
                                        <ListDescription>
                                            {intl.formatMessage({ id: 'openSource.publication.modulector.description' })}
                                        </ListDescription>
                                    </ListContent>
                                </ListItem>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                    <Divider />
                </Grid>
            </Container>
        </>
    )
}

/**
 * Open Source Page.
 * @returns Component.
 */
export const OpenSource = () => {
    return (
        <Base activeItem='open-source' wrapperClass='wrapper'>
            <OpenSourceWrapper />
        </Base>
    )
}
