import React from 'react'
import { Button, Container, Grid, Header, Icon, Image, List, Segment } from 'semantic-ui-react'
import { Base } from '../Base'
import { useIntl } from 'react-intl'

// Declared in base.html
declare const urlPipeline: string

/**
 * Homepage heading
 * @returns Component
 */
const HomepageHeading = () => {
    const intl = useIntl()

    return (
        <Segment id='homepage-heading' inverted>
            <Grid stackable textAlign='center' className='margin-top-2'>
                <Grid.Row columns={1}>
                    <Image
                        rounded
                        size='big'
                        src='/static/frontend/img/homepage/multiomix-logo-name.png'
                        alt={intl.formatMessage({ id: 'homepage.logoAlt' })}
                    />
                </Grid.Row>
                <Grid.Row columns={1}>
                    <Header
                        as='h1'
                        id='header-title'
                        inverted
                        content={intl.formatMessage({ id: 'homepage.headerTitle' })}
                    />
                </Grid.Row>
            </Grid>

            <Container text className='margin-top-5 margin-bottom-5'>
                <Grid stackable>
                    <Grid.Row columns={2}>
                        <Grid.Column>
                            <Button primary size='huge' fluid as='a' href={urlPipeline}>
                                {intl.formatMessage({ id: 'homepage.getStarted' })}
                                <Icon name='arrow right' />
                            </Button>
                        </Grid.Column>
                        <Grid.Column>
                            <Button
                                color='orange'
                                size='huge'
                                fluid
                                as='a'
                                href='https://youtube.com/playlist?list=PL1P-aHbALFjuwUjNeyA5G7vhqJMRjuoAS'
                                target='_blank'
                            >
                                {intl.formatMessage({ id: 'homepage.tutorials' })}
                                <Icon className='margin-left-2' name='youtube' />
                            </Button>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>
        </Segment>
    )
}

/**
 * Wrapper to make Context.Provider work.
 * @returns Component.
 */
const HomepageWrapper = () => {
    const intl = useIntl()
    return (
        <>
            <HomepageHeading />

            {/* <ResponsiveContainer> */}
            <Segment className='padded-segment' vertical>
                {/* <Grid container stackable verticalAlign='middle'> */}
                <Grid stackable verticalAlign='middle'>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Header className='important-title' as='h1'>
                                {intl.formatMessage({ id: 'homepage.empoweringBioinformatics' })}
                            </Header>
                            <div className='middle-size-text'>
                                <p>
                                    {intl.formatMessage({ id: 'homepage.description1' })}
                                </p>
                                <p>
                                    {intl.formatMessage({ id: 'homepage.description2' })}
                                </p>
                                <List>
                                    <List.Item icon='marker' content={intl.formatMessage({ id: 'homepage.pipeline.mirna' })} />
                                    <List.Item icon='marker' content={intl.formatMessage({ id: 'homepage.pipeline.methylation' })} />
                                    <List.Item icon='marker' content={intl.formatMessage({ id: 'homepage.pipeline.cna' })} />
                                </List>
                            </div>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Image
                                id='all-analysis-img'
                                className='margin-left-5'
                                bordered
                                rounded
                                size='large'
                                src='/static/frontend/img/homepage/all-analysis.png'
                                alt={intl.formatMessage({ id: 'homepage.analysisAlt' })}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>

            <Segment className='padded-segment' vertical inverted>
                <Container text>
                    <Header as='h1' className='important-title' inverted>
                        {intl.formatMessage({ id: 'homepage.getInvolved' })}
                    </Header>
                    <p className='middle-size-text'>
                        {intl.formatMessage({ id: 'homepage.openSourceDescription' })}
                    </p>
                </Container>

                <Container text textAlign='center' className='margin-top-5'>
                    <Button id='source-button' secondary basic as='a' size='huge' href='https://github.com/omics-datascience/multiomix' target='_blank' inverted>
                        {intl.formatMessage({ id: 'homepage.source' })}
                        <Icon name='github' className='margin-left-5' />
                    </Button>
                </Container>
            </Segment>
            {/* </ResponsiveContainer> */}
        </>
    )
}

/**
 * Homepage component.
 * @returns Component.
 */
export const Homepage = () => {
    return (
        <Base activeItem='home' wrapperClass='wrapper'>
            <HomepageWrapper />
        </Base>
    )
}
