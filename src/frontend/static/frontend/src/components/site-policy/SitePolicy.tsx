import React from 'react'
import { Container, Grid, Header, Image, List } from 'semantic-ui-react'
import { Base } from '../Base'

/**
 * Site policy (terms and privacy policy) page
 * @returns Component
 */
export const SitePolicy = () => {
    const multiomixLink = <a href='/'>www.multiomix.org</a>
    return (
        <div>
            <Base>
                <Container text className='margin-top-2 margin-bottom-5'>
                    <Grid stackable>
                        {/* Image */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Image
                                    rounded
                                    centered
                                    src='/static/frontend/img/about-us/multiomix-logo-description.png'
                                />
                            </Grid.Column>
                        </Grid.Row>

                        {/* Text */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    Multiomix implements a set of security measures to protect the access to the uploaded datasets. Those measures are enforced with some recommendations to protect the data privacy:
                                </Header>

                                <List bulleted size='big'>
                                    <List.Item>
                                        Multiomix implements authentication—verifying a user’s identity—and authorization—determining what data/resources an authenticated user can access respecting the defined access level.
                                    </List.Item>
                                    <List.Item>
                                        Data transfer is encrypted.
                                    </List.Item>
                                    <List.Item>
                                        {multiomixLink} is protected with a firewall to prevent brute force attacks.
                                    </List.Item>
                                    <List.Item>
                                        The platform is containerized using Docker so that the database services and files cannot be accessed externally.
                                    </List.Item>
                                    <List.Item>
                                        The operators of the service use reasonable security measures to protect against the loss, misuse, and alteration of the information and Data under our control.
                                    </List.Item>
                                    <List.Item>
                                        It is prohibited to use the service {multiomixLink} for the storage of any data that can be classified as Personally Identifiable Information (PII). Only pre-processed and de-identified data should be up-loaded to {multiomixLink}
                                    </List.Item>
                                    <List.Item>
                                        Users can opt for setting up their own local Multiomix instance instead of using the {multiomixLink} service. The instructions to install the local instance are available at <a href='https://github.com/omics-datascience/multiomix/blob/main/DEPLOYING.md' target='_blank' rel='noopener noreferrer'>https://github.com/omics-datascience/multiomix/blob/main/DEPLOYING.md</a>
                                    </List.Item>
                                </List>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </Base>
        </div>
    )
}
