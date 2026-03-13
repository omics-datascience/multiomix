import React from 'react'
import { Base } from '../Base'
import { Container, Divider, Grid, Header, HeaderSubheader, List, ListContent, ListDescription, ListHeader, ListIcon, ListItem } from 'semantic-ui-react'

export const OpenSource = () => {
    return (
        <Base activeItem='open-source' wrapperClass='wrapper'>
            <Container text className='margin-top-2 margin-bottom-5'>
                <Grid stackable>
                    {/* Git hub */}
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h1'>
                                At <a href='https://omicsdatascience.org/' rel='noreferrer' target='_blank'>Omicsdatascience</a>, we believe in open science. Explore our open-source projects, freely available to the community to foster collaboration, transparency, and innovation in biomedical research. Avilable in our <a href='https://github.com/omics-datascience' rel='noreferrer' target='_blank'>GitHub organization</a>.
                            </Header>
                            <HeaderSubheader>
                                These repositories represent some of our most prominent open-source initiatives, developed to empower the research community with accessible and cutting-edge bioinformatics tools.
                            </HeaderSubheader>
                            <List>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/multiomix' target='_blank'>Multiomix</ListHeader>
                                        <ListDescription>Cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation.</ListDescription>
                                    </ListContent>
                                </ListItem>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/modulector' target='_blank'>Modulector</ListHeader>
                                        <ListDescription>Modulector is a performing open platform that provides information about miRNAs, genes and methylation sites based on a compilation of information from different resources.</ListDescription>
                                    </ListContent>
                                </ListItem>
                                <ListItem>
                                    <ListIcon name='github' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' rel='noreferrer' href='https://github.com/omics-datascience/BioAPI' target='_blank'>BioApi</ListHeader>
                                        <ListDescription>A powerful abstraction of genomics databases. Bioapi is a REST API that provides data related to gene nomenclature, gene expression, and metabolic pathways. </ListDescription>
                                    </ListContent>
                                </ListItem>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h2'>
                                Discover our scientific <a href='https://omicsdatascience.org/?page_id=15' rel='noreferrer' target='_blank'>contributions</a>
                            </Header>
                            <HeaderSubheader>
                                In addition to our open-source software, we regularly publish peer-reviewed scientific articles that document the methodologies, innovations, and findings behind our tools. We invite you to explore our publications to better understand the research impact of our work.
                            </HeaderSubheader>
                            <List>
                                <ListItem>
                                    <ListIcon name='file alternate' size='large' verticalAlign='middle' />
                                    <ListContent>
                                        <ListHeader as='a' href='https://omicsdatascience.org/?p=179' rel='noreferrer' target='_blank'>
                                            Multiomix
                                        </ListHeader>
                                        <ListDescription>
                                            A cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation
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
                                            Una plataforma como servicio para el acceso a bases de datos de micro ARNs
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
