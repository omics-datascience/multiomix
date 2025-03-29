import React from 'react'
import { DjangoMiRNADiseasesJSON, RowHeader } from '../../../../utils/django_interfaces'
import { Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { PubmedButton } from './PubmedButton'
import { MiRNAExtraData } from './MiRNAExtraData'

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
    const headers: RowHeader<DjangoMiRNADiseasesJSON>[] = [
        { name: 'Condition associated', serverCodeToSort: 'disease' },
        { name: 'Pubmed' }
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
                headerTitle='miRNA diseases associations'
                headers={headers}
                showSearchInput
                entriesSelectWidth={2}
                searchLabel='Disease'
                searchPlaceholder='Search by disease'
                queryParams={{
                    mirna: props.miRNA
                }}
                urlToRetrieveData={urlMiRNADiseases}
                mapFunction={mapFunction}
            />
        </>
    )
}
