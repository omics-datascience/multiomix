import React from 'react'
import { DjangoMiRNAGeneInteractionJSON, DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import { KySearchParams, Nullable } from '../../../../utils/interfaces'
import { MiRNAExtraData } from './MiRNAExtraData'
import { alertGeneralError, getScoreClassData } from '../../../../utils/util_functions'
import ky from 'ky'
import { LoadingPanel } from './LoadingPanel'
import { Grid, Header, Icon, List, Statistic } from 'semantic-ui-react'
import { ListOfElementsWithHeader } from './ListOfElementsWithHeader'
import { PubmedButton } from './PubmedButton'

declare const urlMiRNAInteraction: string

/**
 * Component's props
 */
interface MiRNATargetInteractionPanelProps {
    miRNAData: Nullable<DjangoMiRNADataJSON>,
    miRNA: string,
    gene: string,
}

/**
 * Component's state
 */
interface MiRNATargetInteractionPanelState {
    data: Nullable<DjangoMiRNAGeneInteractionJSON>,
    gettingData: boolean
}

/**
 * Renders a list of miRNA interactions as Cards
 * @param props Component's props
 * @returns Component
 */
export class MiRNATargetInteractionPanel extends React.Component<
    MiRNATargetInteractionPanelProps,
    MiRNATargetInteractionPanelState
> {
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            data: null,
            gettingData: false
        }
    }

    componentDidMount () {
        this.getData()
    }

    /**
     * Abort controller if component unmount
     */
    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Retrieves data from server
     */
    getData () {
        const searchParams: KySearchParams = {
            mirna: this.props.miRNA,
            gene: this.props.gene
        }

        this.setState({ gettingData: true }, () => {
            ky.get(urlMiRNAInteraction, { signal: this.abortController.signal, searchParams, timeout: 60000 }).then((response) => {
                response.json().then((data: DjangoMiRNAGeneInteractionJSON) => {
                    this.setState({ data })
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!this.abortController.signal.aborted) {
                    // If an error ocurred, sets the selected row to null
                    alertGeneralError()
                }

                console.log('Error getting miRNA target interactions ->', err)
            }).finally(() => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ gettingData: false })
                }
            })
        })
    }

    render () {
        if (this.state.gettingData) {
            return <LoadingPanel />
        }

        if (!this.state.data) {
            return (
                <Header size='huge' icon textAlign='center'>
                    <Icon name='times circle' />

                    No data found

                    <Header.Subheader>
                        Sorry! Try again later
                    </Header.Subheader>
                </Header>
            )
        }

        const scoreClassData = getScoreClassData(this.state.data.score_class)

        return (
            <React.Fragment>
                <MiRNAExtraData miRNA={this.props.miRNA} miRNAData={this.props.miRNAData} />

                <Grid className='margin-top-2'>
                    <Grid.Row stretched>
                        <Grid.Column width={6} textAlign='center'>
                            <Statistic size='huge' color={scoreClassData.color}>
                                <Statistic.Value>
                                    <Icon name='star' />{this.state.data.score}
                                </Statistic.Value>
                                <Statistic.Label>
                                    Score ({scoreClassData.description})
                                </Statistic.Label>
                            </Statistic>

                            <Header id='score-source-header' size='huge'>
                                Score source: {this.state.data.source_name}
                            </Header>
                        </Grid.Column>

                        {/* Sources */}
                        <Grid.Column width={5}>
                            <ListOfElementsWithHeader headerTitle='Sources' headerIcon='newspaper'>
                                {this.state.data.sources.map((source) => (
                                    <List.Item key={source}>
                                        <List.Icon name='newspaper' size='large' verticalAlign='middle' />
                                        <List.Content>
                                            <List.Header>
                                                {source}
                                            </List.Header>
                                        </List.Content>
                                    </List.Item>
                                ))}
                            </ListOfElementsWithHeader>
                        </Grid.Column>

                        {/* Pubmeds */}
                        <Grid.Column width={5}>
                            <ListOfElementsWithHeader headerTitle='Pubmeds' headerIcon='file'>
                                {this.state.data.pubmeds.map((pubmed) => (
                                    <PubmedButton key={pubmed} pubmedURL={pubmed} />
                                ))}
                            </ListOfElementsWithHeader>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </React.Fragment>
        )
    }
}
