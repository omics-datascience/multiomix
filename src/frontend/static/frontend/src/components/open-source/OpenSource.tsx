import React from 'react'
import { Base } from '../Base'
import { Container, Divider, Grid, Header, HeaderSubheader, List, ListContent, ListDescription, ListHeader, ListIcon, ListItem } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

export const OpenSource = () => {
    const intl = useIntl()
    return (
        <Base activeItem='open-source' wrapperClass='wrapper'>
            <Container text className='margin-top-2 margin-bottom-5'>
                <Grid stackable>
                    {/* Git hub */}
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h1'>
                                {intl.formatMessage({ id: 'openSource.header.main' })}{' '}
                                <a href='https://omicsdatascience.org/' rel='noreferrer' target='_blank'>
                                    Omicsdatascience
                                </a>{' '}
                                <a href='https://github.com/omics-datascience' rel='noreferrer' target='_blank'>
                                    GitHub
                                </a>.
                            </Header>
                            <HeaderSubheader>
                                {intl.formatMessage({ id: 'openSource.header.sub' })}
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
                                {intl.formatMessage({ id: 'openSource.publications.title' })}{' '} <a href='https://omicsdatascience.org/?page_id=15' rel='noreferrer' target='_blank'>contributions</a>
                            </Header>
                            <HeaderSubheader>
                                {intl.formatMessage({ id: 'openSource.publications.sub' })}
                            </HeaderSubheader>
                            <List>
                                <ListItem>
                                    <ListIcon name='file alternate' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' href='https://omicsdatascience.org/?p=179' rel='noreferrer' target='_blank'>
                                            Multiomix
                                        </ListHeader>
                                        <ListDescription>
                                            {intl.formatMessage({ id: 'openSource.publications.multiomix.description' })}
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
                                            {intl.formatMessage({ id: 'openSource.publications.modulector.description' })}
                                        </ListDescription>
                                    </ListContent>
                                </ListItem>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                    <Divider />
                </Grid>
            </Container>
        </Base>
    )
}
