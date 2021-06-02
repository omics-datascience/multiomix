import React from 'react'
import { Button, Container, Grid, Header, Icon, Image, List, Segment } from 'semantic-ui-react'
import { Base } from '../Base'

// Declared in base.html
declare const urlPipeline: string

/** Component's props */
interface HomepageHeadingProps {
    mobile: boolean
}

/**
 * Homepage heading
 * @param props Component's props
 * @returns Component
 */
const HomepageHeading = (props: HomepageHeadingProps) => (
    /* TODO: refactor with css */
    <Segment id='homepage-heading' inverted>
        <Grid stackable textAlign='center'>
            <Grid.Row columns={1}>
                <Image rounded size='big' src='/static/frontend/img/homepage/multiomix-logo-name.png' />
            </Grid.Row>
            <Grid.Row columns={1}>
                <Header
                    as='h1'
                    id='header-title'
                    inverted
                    content='Cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation'
                    style={{
                        /* TODO: implement responsiveness */
                        fontSize: props.mobile ? '2em' : '4em'
                    }}
                />
            </Grid.Row>
        </Grid>

        <Container text className='margin-top-5 margin-bottom-5'>
            <Grid stackable>
                <Grid.Row columns={2}>
                    <Grid.Column>
                        {/* TODO: limit to logged used */}
                        {/* TODO: fix link */}
                        <Button primary size='huge' fluid as='a' href={urlPipeline}>
                            Get Started
                            <Icon name='arrow right' />
                        </Button>
                    </Grid.Column>
                    <Grid.Column>
                        {/* TODO: fix link */}
                        <Button color='orange' size='huge' fluid as='a' href='#'>
                            Tutorials
                            <Icon className='margin-left-2' name='youtube' />
                        </Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Container>
    </Segment>
)

/**
 * Homepage component
 * @returns Component
 */
export const Homepage = () => {
    return (
        <div>
            <Base activeItem='home'>
                <HomepageHeading mobile={false} />
                {/* <ResponsiveContainer> */}
                <Segment className='padded-segment' vertical>
                    {/* <Grid container stackable verticalAlign='middle'> */}
                    <Grid stackable verticalAlign='middle'>
                        <Grid.Row>
                            <Grid.Column width={8}>
                                <Header className='important-title' as='h1'>
                                    Empowering bioinformatics
                                </Header>
                                <div className='middle-size-text'>
                                    <p>
                                        Multiomix is an interactive cloud platform that allows biologists to identify genetic and epigenetic events associated with the transcriptional modulation of cancer-related genes through the analysis of multi-omics data available on public or private functional genomic databases.
                                    </p>
                                    <p>
                                        Briefly, Multiomix combines a user-friendly GUI, an integrated set of functions for data retrieval, aggregation, and storage of multi-omics data with three predefined pipelines that allow the identification of:
                                    </p>
                                    <List>
                                        <List.Item icon='marker' content='Genes post-transcriptionally modulated by microRNAs (miRNA pipeline)'/>
                                        <List.Item icon='marker' content='Genes transcriptionally silenced by promoter hyper-methylation (Methylation pipeline)'/>
                                        <List.Item icon='marker' content='Genes/Chromosome regions of potential focal amplification and over-expression (CNA pipeline)'/>
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
                                />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Segment>

                <Segment className='padded-segment' vertical inverted>
                    <Container text>
                        <Header as='h1' className='important-title' inverted>
                            Get involved!
                        </Header>
                        <p className='middle-size-text'>
                            Multiomix is a free and open-source platform hosted on Github. If you are a developer and want to contribute any kind of help is welcome and appreciated. Feel free to submit an issue o make a Pull Request!
                        </p>
                    </Container>

                    <Container text textAlign='center' className='margin-top-2'>
                        {/* TODO: fix link */}
                        <Button id='source-button' secondary basic as='a' size='huge' href='#' inverted>
                            Source
                            <Icon name='github' className='margin-left-5' />
                        </Button>
                    </Container>
                </Segment>
                {/* </ResponsiveContainer> */}
            </Base>
        </div>
    )
}
