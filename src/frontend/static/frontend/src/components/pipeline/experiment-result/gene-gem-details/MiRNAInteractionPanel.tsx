import React from 'react'
import { Icon, List, Popup, Table } from 'semantic-ui-react'
import { DjangoMiRNAGeneInteractionJSON, RowHeader } from '../../../../utils/django_interfaces'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { PubmedButton } from './PubmedButton'
import { MiRNAExtraData } from './MiRNAExtraData'
import { getScoreClassData } from '../../../../utils/util_functions'
import { useIntl } from 'react-intl'

declare const urlMiRNAInteraction: string

// Number of Pubmed papers to show until renders a collapsible menu
const NUMBER_OF_ELEMENTS_UNTIL_POPUP: number = 5

/**
 * A Popup with explanations of mirDIP Score class
 * @returns Component
 */
const InfoPopupScoreClass = () => {
    const intl = useIntl()

    return (
        <List bulleted>
            <List.Item>{intl.formatMessage({ id: 'miRNAInteractionPanel.scoreClass.veryHigh' })}</List.Item>
            <List.Item>{intl.formatMessage({ id: 'miRNAInteractionPanel.scoreClass.high' })}</List.Item>
            <List.Item>{intl.formatMessage({ id: 'miRNAInteractionPanel.scoreClass.medium' })}</List.Item>
            <List.Item>{intl.formatMessage({ id: 'miRNAInteractionPanel.scoreClass.low' })}</List.Item>
        </List>
    )
}

/**
 * Component's props
 */
interface MiRNAInteractionPanelProps {
    /** miRNA identifier to send to the backend. */
    miRNA: string,
    showGeneSearchInput: boolean
}

/**
 * Renders a list of miRNA interactions as Cards
 * @param props Component's props
 * @returns Component
 */
export const MiRNAInteractionPanel = (props: MiRNAInteractionPanelProps) => {
    const intl = useIntl()
    const headers: RowHeader<DjangoMiRNAGeneInteractionJSON>[] = [
        { name: intl.formatMessage({ id: 'miRNAInteractionPanel.gene' }), serverCodeToSort: 'gene', width: 3 },
        { name: intl.formatMessage({ id: 'miRNAInteractionPanel.sources' }), serverCodeToSort: 'source_name', width: 3 },
        {
            name: intl.formatMessage({ id: 'miRNAInteractionPanel.mirDIPScore' }),
            serverCodeToSort: 'score',
            infoPopupContent: intl.formatMessage({ id: 'miRNAInteractionPanel.mirDIPScoreInfo' }),
            width: 2
        },
        {
            name: intl.formatMessage({ id: 'miRNAInteractionPanel.mirDIPScoreClass' }),
            infoPopupContent: <InfoPopupScoreClass />,
            width: 2
        },
        { name: intl.formatMessage({ id: 'miRNAInteractionPanel.pubmed' }) }
    ]

    const generatePubmedButton = (paper: string) => (
        <PubmedButton key={paper} pubmedURL={paper} />
    )

    return (
        <>
            <MiRNAExtraData miRNA={props.miRNA} />

            <PaginatedTable<DjangoMiRNAGeneInteractionJSON>
                headerTitle={intl.formatMessage({ id: 'miRNAInteractionPanel.headerTitle' })}
                headers={headers}
                queryParams={{ mirna: props.miRNA }}
                showSearchInput={props.showGeneSearchInput}
                searchLabel={intl.formatMessage({ id: 'miRNAInteractionPanel.searchLabel' })}
                searchPlaceholder={intl.formatMessage({ id: 'miRNAInteractionPanel.searchPlaceholder' })}
                defaultSortProp={{
                    sortField: 'score',
                    sortOrderAscendant: false
                }}
                customFilters={[
                    { label: intl.formatMessage({ id: 'miRNAInteractionPanel.includePubmeds' }), keyForServer: 'include_pubmeds', defaultValue: false, type: 'checkbox' }
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

                                {restOfPubmedPapers.length > 0 && (
                                    <Popup
                                        trigger={(
                                            <Icon
                                                title={intl.formatMessage({ id: 'miRNAInteractionPanel.seeMorePapers' })}
                                                name='plus circle'
                                                color='teal'
                                                className='clickable'
                                            />
                                        )}
                                        on='click'
                                        position='left center'
                                        content={
                                            restOfPubmedPapers.map(generatePubmedButton)
                                        }
                                        size='mini'
                                    />
                                )}
                            </Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
