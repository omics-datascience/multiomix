import React from 'react'
import { Icon, List, Popup, Table } from 'semantic-ui-react'
import { DjangoMiRNAGeneInteractionJSON, RowHeader, DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import { Nullable } from '../../../../utils/interfaces'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { PubmedButton } from './PubmedButton'
import { MiRNAExtraData } from './MiRNAExtraData'
import { getScoreClassData } from '../../../../utils/util_functions'

declare const urlMiRNAInteraction: string

// Number of Pubmed papers to show until renders a collapsible menu
const NUMBER_OF_ELEMENTS_UNTIL_POPUP: number = 5

/**
 * A Popup with explanations of mirDIP Score class
 * @returns Component
 */
const InfoPopupScoreClass = () => (
    <List bulleted>
        <List.Item>Very high: top 1% ranks</List.Item>
        <List.Item>High: top 5% (excluding top 1%)</List.Item>
        <List.Item>Medium: top 1/3 (excluding top 5%)</List.Item>
        <List.Item>Low: remaining predictions</List.Item>
    </List>
)

/**
 * Component's props
 */
interface MiRNAInteractionPanelProps {
    miRNAData: Nullable<DjangoMiRNADataJSON>,
    miRNA: string,
    showGeneSearchInput: boolean
}

/**
 * Renders a list of miRNA interactions as Cards
 * @param props Component's props
 * @returns Component
 */
export const MiRNAInteractionPanel = (props: MiRNAInteractionPanelProps) => {
    const headers: RowHeader<DjangoMiRNAGeneInteractionJSON>[] = [
        { name: 'Gene', serverCodeToSort: 'gene', width: 3 },
        { name: 'Sources', serverCodeToSort: 'source_name', width: 3 },
        {
            name: 'mirDIP score',
            serverCodeToSort: 'score',
            infoPopupContent: 'mirDIP scores of human microRNA target predictions were ranked according to four confidence classes (Very high, High, Medium and Low)',
            width: 2
        },
        {
            name: 'mirDIP score class',
            infoPopupContent: <InfoPopupScoreClass />,
            width: 2
        },
        { name: 'Pubmed' }
    ]

    const generatePubmedButton = (paper: string) => (
        <PubmedButton key={paper} pubmedURL={paper} />
    )

    return (
        <React.Fragment>
            <MiRNAExtraData miRNA={props.miRNA} miRNAData={props.miRNAData} />

            <PaginatedTable<DjangoMiRNAGeneInteractionJSON>
                headerTitle='Interactions'
                headers={headers}
                queryParams={{ mirna: props.miRNA }}
                showSearchInput={props.showGeneSearchInput}
                searchLabel='Gene'
                searchPlaceholder='Search by gene'
                defaultSortProp={{
                    sortField: 'score',
                    sortOrderAscendant: false
                }}
                customFilters={[
                    { label: 'Include pubmeds', keyForServer: 'include_pubmeds', defaultValue: false, type: 'checkbox' }
                ]}
                urlToRetrieveData={urlMiRNAInteraction}
                mapFunction={(miRNAInteraction: DjangoMiRNAGeneInteractionJSON) => {
                    const firstPubmedPapers = miRNAInteraction.pubmeds.slice(0, NUMBER_OF_ELEMENTS_UNTIL_POPUP)
                    const restOfPubmedPapers = miRNAInteraction.pubmeds.slice(NUMBER_OF_ELEMENTS_UNTIL_POPUP)
                    const scoreClassData = getScoreClassData(miRNAInteraction.score_class)

                    return (
                        <Table.Row key={miRNAInteraction.id}>
                            <Table.Cell>{miRNAInteraction.gene}</Table.Cell>
                            <Table.Cell>{miRNAInteraction.source_name}</Table.Cell>
                            <Table.Cell>{miRNAInteraction.score}</Table.Cell>
                            <Table.Cell textAlign='center' className={`cell ${scoreClassData.color}`}>
                                <strong>{scoreClassData.description}</strong>
                            </Table.Cell>
                            <Table.Cell>
                                {firstPubmedPapers.map(generatePubmedButton)}

                                {restOfPubmedPapers.length > 0 &&
                                    <Popup
                                        trigger={
                                            <Icon
                                                title='See more papers'
                                                name='plus circle'
                                                color='teal'
                                                className='clickable'
                                            />
                                        }
                                        on='click'
                                        position='left center'
                                        content={
                                            restOfPubmedPapers.map(generatePubmedButton)
                                        }
                                        size='mini'
                                    />
                                }
                            </Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </React.Fragment>
    )
}
