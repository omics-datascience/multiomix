import React from 'react'
import { DjangoMiRNADrugsJSON, RowHeader } from '../../../../utils/django_interfaces'
import { Table, Button, Icon } from 'semantic-ui-react'
import { PaginationCustomFilter, PaginatedTable } from '../../../common/PaginatedTable'
import { MiRNAExtraData } from './MiRNAExtraData'

declare const urlMiRNAeDrugs: string

/**
 * Component's props
 */
interface MiRNADrugsPanelProps {
    /** miRNA identifier to send to the backend. */
    miRNA: string,
}

/**
 * Renders a list of miRNA associated drugs
 * @param props Component's props
 * @returns Component
 */
export const MiRNADrugsPanel = (props: MiRNADrugsPanelProps) => {
    const headers: RowHeader<DjangoMiRNADrugsJSON>[] = [
        { name: 'Drug associated', serverCodeToSort: 'condition' },
        { name: 'Detection method', serverCodeToSort: 'detection_method' },
        { name: 'Small molecule', serverCodeToSort: 'small_molecule' },
        { name: 'Expression pattern', serverCodeToSort: 'expression_pattern' },
        { name: 'Reference', serverCodeToSort: 'reference' },
        { name: 'Support', serverCodeToSort: 'support' },
        { name: 'FDA approved' },
        { name: 'Pubmed' }
    ]

    const mapFunction = (drugRow: DjangoMiRNADrugsJSON) => {
        return (
            <Table.Row key={drugRow.id}>
                <Table.Cell>{drugRow.condition}</Table.Cell>
                <Table.Cell>{drugRow.detection_method}</Table.Cell>
                <Table.Cell>{drugRow.small_molecule}</Table.Cell>
                <Table.Cell>{drugRow.expression_pattern}</Table.Cell>
                <Table.Cell>{drugRow.reference}</Table.Cell>
                <Table.Cell>{drugRow.support}</Table.Cell>
                <Table.Cell textAlign='center'>
                    <Icon
                        name={drugRow.fda_approved ? 'check' : 'times'}
                        color={drugRow.fda_approved ? 'green' : 'red'}
                    />
                </Table.Cell>
                <Table.Cell textAlign='center'>
                    <Button
                        basic
                        color="blue"
                        icon
                        title="See in NCBI"
                        className="borderless-button"
                        as='a' href={drugRow.pubmed} target="_blank"
                    >
                        <Icon
                            name='file'
                        />
                    </Button>
                </Table.Cell>
            </Table.Row>
        )
    }

    const customInputs: PaginationCustomFilter[] = [
        {
            label: 'FDA approved',
            keyForServer: 'fda_approved',
            defaultValue: 0,
            width: 2,
            options: [
                { key: 'all', text: 'All', value: 0 },
                { key: 'yes', text: 'Yes', value: 'true' },
                { key: 'no', text: 'No', value: 'false' }
            ]
        }
    ]

    return (
        <React.Fragment>
            <MiRNAExtraData miRNA={props.miRNA} />

            <PaginatedTable<DjangoMiRNADrugsJSON>
                headerTitle='miRNA drugs associations'
                headers={headers}
                customFilters={customInputs}
                searchWidth={4}
                entriesSelectWidth={2}
                showSearchInput
                searchLabel='Condition/Molecule/Pattern'
                searchPlaceholder='Search by drug, S.M. or Exp. P.'
                queryParams={{
                    mirna: props.miRNA
                }}
                urlToRetrieveData={urlMiRNAeDrugs}
                mapFunction={mapFunction}
            />
        </React.Fragment>
    )
}
