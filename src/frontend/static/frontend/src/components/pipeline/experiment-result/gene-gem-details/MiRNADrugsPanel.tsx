import React from 'react'
import { DjangoMiRNADrugsJSON, RowHeader } from '../../../../utils/django_interfaces'
import { Table, Button, Icon } from 'semantic-ui-react'
import { PaginationCustomFilter, PaginatedTable } from '../../../common/PaginatedTable'
import { MiRNAExtraData } from './MiRNAExtraData'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    const headers: RowHeader<DjangoMiRNADrugsJSON>[] = [
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.drugAssociated' }), serverCodeToSort: 'condition' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.detectionMethod' }), serverCodeToSort: 'detection_method' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.smallMolecule' }), serverCodeToSort: 'small_molecule' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.expressionPattern' }), serverCodeToSort: 'expression_pattern' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.reference' }), serverCodeToSort: 'reference' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.support' }), serverCodeToSort: 'support' },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.fdaApproved' }) },
        { name: intl.formatMessage({ id: 'miRNADrugsPanel.pubmed' }) }
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
                        color='blue'
                        icon
                        title={intl.formatMessage({ id: 'miRNADrugsPanel.seeInNCBI' })}
                        className='borderless-button'
                        as='a' href={drugRow.pubmed} target='_blank'
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
            label: intl.formatMessage({ id: 'miRNADrugsPanel.filter.fdaApproved' }),
            keyForServer: 'fda_approved',
            defaultValue: 0,
            width: 2,
            options: [
                { key: 'all', text: intl.formatMessage({ id: 'common.all' }), value: 0 },
                { key: 'yes', text: intl.formatMessage({ id: 'miRNADrugsPanel.filter.yes' }), value: 'true' },
                { key: 'no', text: intl.formatMessage({ id: 'miRNADrugsPanel.filter.no' }), value: 'false' }
            ]
        }
    ]

    return (
        <>
            <MiRNAExtraData miRNA={props.miRNA} />

            <PaginatedTable<DjangoMiRNADrugsJSON>
                headerTitle={intl.formatMessage({ id: 'miRNADrugsPanel.headerTitle' })}
                headers={headers}
                customFilters={customInputs}
                searchWidth={4}
                entriesSelectWidth={2}
                showSearchInput
                searchLabel={intl.formatMessage({ id: 'miRNADrugsPanel.searchLabel' })}
                searchPlaceholder={intl.formatMessage({ id: 'miRNADrugsPanel.searchPlaceholder' })}
                queryParams={{
                    mirna: props.miRNA
                }}
                urlToRetrieveData={urlMiRNAeDrugs}
                mapFunction={mapFunction}
            />
        </>
    )
}
