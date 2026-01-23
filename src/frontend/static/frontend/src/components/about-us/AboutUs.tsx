import React from 'react'
import { Container, Divider, Grid, Header, Image, List } from 'semantic-ui-react'
import { Base } from '../Base'
import { useIntl } from 'react-intl'

const EMAILS: string[] = [
    'mcabba@gmail.com',
    'matias.butti@gmail.com',
    'genarocamele@gmail.com'
]

/**
 * About us page
 * @returns Component
 */
export const AboutUs = () => {
    const intl = useIntl()
    return (
        <div>
            <Base activeItem='about-us' wrapperClass='wrapper'>
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

                        {/* Institutions */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    {intl.formatMessage({ id: 'about.description' })}
                                </Header>

                                <List>
                                    <List.Item icon='building' content={intl.formatMessage({ id: 'about.institution.caeti' })} />
                                    <List.Item icon='building' content={intl.formatMessage({ id: 'about.institution.ciniba' })} />
                                    <List.Item icon='building' content={intl.formatMessage({ id: 'about.institution.lidi' })} />
                                </List>
                            </Grid.Column>
                        </Grid.Row>

                        <Divider />

                        {/* Coordination */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <Header as='h1'>
                                    {intl.formatMessage({ id: 'about.coordination' })}
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
                                    {intl.formatMessage({ id: 'about.members.title' })}
                                </Header>

                                <Header as='h3'>
                                    {intl.formatMessage({ id: 'about.members.main' })} PhD in Computer Science Genaro Camele
                                </Header>

                                <Header as='h3'>
                                    {intl.formatMessage({ id: 'about.members.collaborators' })} Esp. Hernán Chanfreau, Dr. Sebastián Menazzi, St. Agustín Marraco, B.Comp.Sc. Julián Muhlberger, St. Ramiro Lasorsa, PhD. Waldo Hasperué

                                </Header>
                            </Grid.Column>
                        </Grid.Row>

                        <Divider />

                        {/* Contact */}
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                {/* Contact */}
                                <Header as='h3'>
                                    {intl.formatMessage({ id: 'about.contact.title' })}
                                </Header>

                                <p>{intl.formatMessage({ id: 'about.contact.questions' })}</p>

                                {EMAILS.map((email) => (
                                    <p key={email}>
                                        <a href={`mailto:${email}`}>{email}</a>
                                    </p>
                                ))}

                                <p>{intl.formatMessage({ id: 'about.contact.institutions' })}</p>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </Base>
        </div>
    )
}
