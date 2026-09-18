import React from 'react'
import { DjangoMiRNADiseasesJSON, RowHeader } from '../../../../utils/django_interfaces'
import { Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { PubmedButton } from './PubmedButton'
import { MiRNAExtraData } from './MiRNAExtraData'
import { useIntl } from 'react-intl'

declare const urlMiRNADiseases: string

/**
 * Component's props
 */
interface MiRNADiseasesPanelProps {
    /** miRNA identifier to send to the backend. */
    miRNA: string,
}

/**
 * Renders a list of miRNA associated diseases
 * @param props Component's props
 * @returns Component
 */
export const MiRNADiseasesPanel = (props: MiRNADiseasesPanelProps) => {
    const intl = useIntl()
    const headers: RowHeader<DjangoMiRNADiseasesJSON>[] = [
        { name: intl.formatMessage({ id: 'miRNADiseasesPanel.conditionAssociated' }), serverCodeToSort: 'disease' },
        { name: intl.formatMessage({ id: 'miRNADiseasesPanel.pubmed' }) }
    ]

    const mapFunction = (diseaseRow: DjangoMiRNADiseasesJSON) => {
        return (
            <Table.Row key={diseaseRow.id}>
                <Table.Cell>{diseaseRow.disease}</Table.Cell>
                <Table.Cell>
                    <PubmedButton pubmedURL={diseaseRow.pubmed} />
                </Table.Cell>
            </Table.Row>
        )
    }

    return (
        <>
            <MiRNAExtraData miRNA={props.miRNA} />

            <PaginatedTable<DjangoMiRNADiseasesJSON>
                headerTitle={intl.formatMessage({ id: 'miRNADiseasesPanel.headerTitle' })}
                headers={headers}
                showSearchInput
                entriesSelectWidth={2}
                searchLabel={intl.formatMessage({ id: 'miRNADiseasesPanel.searchLabel' })}
                searchPlaceholder={intl.formatMessage({ id: 'miRNADiseasesPanel.searchPlaceholder' })}
                queryParams={{
                    mirna: props.miRNA
                }}
                urlToRetrieveData={urlMiRNADiseases}
                mapFunction={mapFunction}
            />
        </>
    )
}
