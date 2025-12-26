import React from 'react'
import { DropdownItemProps, Icon, Table } from 'semantic-ui-react'
import { Biomarker, BiomarkerMolecule } from '../../types'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { MoleculeTypeLabel } from '../../labels/MoleculeTypeLabel'
import { MoleculeType, Nullable } from '../../../../utils/interfaces'
import { useIntl } from 'react-intl'

declare const urlBiomarkerMolecules: string

/** MoleculesTable props. */
interface MoleculesTableProps {
    /** Selected Biomarker instance to retrieve all its molecules. */
    selectedBiomarker: Biomarker,
    /** Selected BiomarkerMolecule instance to show the row as active. */
    selectedMolecule: Nullable<BiomarkerMolecule>,
    /** Callback to show all the molecules details. */
    openMoleculeDetails: (molecule: BiomarkerMolecule) => void
}

/**
 * Renders a Table with the samples and the cluster where they belong.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculesTable = (props: MoleculesTableProps) => {
    const intl = useIntl()
    const moleculesTypesOptions: DropdownItemProps[] = [
        { key: MoleculeType.MRNA, text: intl.formatMessage({ id: 'moleculesTable.type.mrna' }), value: MoleculeType.MRNA },
        { key: MoleculeType.MIRNA, text: intl.formatMessage({ id: 'moleculesTable.type.mirna' }), value: MoleculeType.MIRNA },
        { key: MoleculeType.CNA, text: intl.formatMessage({ id: 'moleculesTable.type.cna' }), value: MoleculeType.CNA },
        { key: MoleculeType.METHYLATION, text: intl.formatMessage({ id: 'moleculesTable.type.methylation' }), value: MoleculeType.METHYLATION }
    ]
    return (
        <PaginatedTable<BiomarkerMolecule>
            headers={[
                { name: intl.formatMessage({ id: 'moleculesTable.header.identifier' }), serverCodeToSort: 'identifier', width: 3 },
                { name: intl.formatMessage({ id: 'moleculesTable.header.type' }), serverCodeToSort: 'type', width: 2 },
                { name: intl.formatMessage({ id: 'moleculesTable.header.actions' }) }
            ]}
            queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
            customFilters={[
                { label: intl.formatMessage({ id: 'moleculesTable.header.type' }), keyForServer: 'type', defaultValue: '', options: moleculesTypesOptions, width: 6 }
            ]}
            defaultSortProp={{ sortField: 'identifier', sortOrderAscendant: true }}
            showSearchInput
            defaultPageSize={25}
            searchLabel={intl.formatMessage({ id: 'moleculesTable.search.label' })}
            searchPlaceholder={intl.formatMessage({ id: 'moleculesTable.search.placeholder' })}
            urlToRetrieveData={urlBiomarkerMolecules}
            searchWidth={6}
            entriesSelectWidth={3}
            mapFunction={(molecule: BiomarkerMolecule) => (
                <Table.Row key={molecule.identifier} active={props.selectedMolecule?.identifier === molecule.identifier && props.selectedMolecule.type === molecule.type}>
                    <TableCellWithTitle className='align-center' value={molecule.identifier} />
                    <Table.Cell><MoleculeTypeLabel moleculeType={molecule.type} /></Table.Cell>
                    {/* TODO: add dblClick to show its details too */}
                    <Table.Cell width={1}>
                        {/* Details button */}
                        <Icon
                            name='chart bar'
                            className='clickable'
                            color='blue'
                            title={intl.formatMessage({ id: 'moleculesTable.details' })}
                            onClick={() => props.openMoleculeDetails(molecule)}
                        />
                    </Table.Cell>
                </Table.Row>
            )}
        />
    )
}
