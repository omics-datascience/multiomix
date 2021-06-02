import React from 'react'
import { Container, Divider, Grid, Header, Image, List } from 'semantic-ui-react'
import { Base } from '../Base'

const EMAILS: string[] = [
    'matias.butti@gmail.com',
    'genarocamele@gmail.com',
    'mcabba@gmail.com'
]

/**
 * Homepage component
 * @returns Component
 */
export const AboutUs = () => {
    return (
        <div>
            <Base activeItem='about-us'>
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

                        {/* Institutions */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    Multiomix is the result of interdisciplinary work between members of the following scientific institutions:
                                </Header>

                                <List>
                                    <List.Item icon='building' content='CAETI - Universidad Abierta Interamericana' />
                                    <List.Item icon='building' content='CINIBA - Faculty of Medical Sciences - UNLP' />
                                    <List.Item icon='building' content='LIDI - Faculty of Informatics - UNLP' />
                                </List>
                            </Grid.Column>
                        </Grid.Row>

                        <Divider />

                        {/* Coordination */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    Project coordination:
                                </Header>

                                <List>
                                    <List.Item icon='user' content='PhD Martín Abba' />
                                    <List.Item icon='user' content='Dr. MSc. Matias Butti' />
                                </List>
                            </Grid.Column>
                        </Grid.Row>

                        <Divider />

                        {/* Collaborators */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    Project members
                                </Header>

                                <Header as='h3'>
                                    Main contributor: Lic. Genaro Camele
                                </Header>

                                <Header as='h3'>
                                    Collaborators: Esp. Hernán Chanfreau, Dr. Sebastián Menazzi, St. Agustín Marraco, PhD. Waldo Hasperué
                                </Header>
                            </Grid.Column>
                        </Grid.Row>

                        <Divider />

                        {/* Contact */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                {/* Contact */}
                                <Header as='h3'>
                                    Contact:
                                </Header>

                                <p>For contact write to:</p>
                                {EMAILS.map((email) => (
                                    <p key={email}>
                                        <a href={`mailto:${email}`}>{email}</a>
                                    </p>
                                ))}
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </Base>
        </div>
    )
}
