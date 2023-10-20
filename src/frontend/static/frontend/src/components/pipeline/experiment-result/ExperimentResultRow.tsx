import React from 'react'
import { DjangoMRNAxGEMResultRow } from '../../../utils/django_interfaces'
import { Table, Icon } from 'semantic-ui-react'
import { Nullable } from '../../../utils/interfaces'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'

/**
 * Component's props
 */
interface ExperimentResultRowProps {
    /** Current row to display the info */
    row: DjangoMRNAxGEMResultRow,
    /** Selected row to set the row as marked */
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    /** Flag to show p-values and adjusted p-values in high precision */
    showHighPrecision: boolean,
    /** Callback to open the details modal */
    openDetailsModal: (selectedRow: DjangoMRNAxGEMResultRow) => void,
}

/**
 * Renders a ResultTable's row
 * @param props Component's props
 * @returns Component
 */
export const ExperimentResultRow = (props: ExperimentResultRowProps) => {
    /**
     * Generates a valid value to display in table. It could be
     * a string if user has selected to hide high precision or a number
     * rounded to 3 exponential values
     * @param value Value to parse
     * @returns Value to display
     */
    function getPValueDisplay (value: number): string {
        if (value) {
            return !props.showHighPrecision && value < 0.001
                ? 'p < .001'
                : value.toExponential(3)
        }

        return '0.0'
    }

    const isActive = props.selectedRow !== null &&
       props.selectedRow.gene === props.row.gene &&
       props.selectedRow.gem === props.row.gem

    // Formats p-values and adjusted p-values
    const pValueDisplay = getPValueDisplay(props.row.p_value)
    const adjustedPValueDisplay = getPValueDisplay(props.row.adjusted_p_value)

    return (
        <Table.Row active={isActive}>
            <Table.Cell width={4}>{props.row.gem}</Table.Cell>
            <Table.Cell width={4}>{props.row.gene}</Table.Cell>
            <Table.Cell width={2}>{props.row.gene_extra_data?.chromosome ?? '-'}</Table.Cell>
            <Table.Cell>{props.row.gene_extra_data?.start ?? '-'}</Table.Cell>
            <Table.Cell>{props.row.gene_extra_data?.end ?? '-'}</Table.Cell>
            <TableCellWithTitle value={props.row.gene_extra_data?.type ?? '-'} />
            <TableCellWithTitle value={props.row.gene_extra_data?.description ?? '-'} />
            <Table.Cell width={2}>{props.row.correlation.toFixed(4)}</Table.Cell>
            <Table.Cell width={2}>{pValueDisplay}</Table.Cell>
            <Table.Cell width={2}>{adjustedPValueDisplay}</Table.Cell>
            <Table.Cell width={2}>
                {/* Details button */}
                <Icon
                    name='chart bar'
                    className='clickable'
                    color='blue'
                    title='Details'
                    onClick={() => props.openDetailsModal(props.row)}
                />

                {/* <Popup
                    on='click'
                    position='right center'
                    wide
                    trigger={
                        <Icon
                            name='info'
                            color='blue'
                            size='small'
                            circular
                            className='margin-left-5 float-right'
                        />
                    }
                    // open={this.state.showAssumptions}
                    onClose={this.cleanPopup}
                    // content={<PayerPopup payerInfo={this.state.payerInfo} />}
                    content={<h1>Details</h1>}
                    // onOpen={() => this.getPayerInfo(tuple.payer_short, tupleId)}
                    onOpen={() => {}}
                /> */}

                {/* Correlation graph */}
                {/* <Icon
                    name={isActive && props.gettingCorrelationData ? 'sync alternate' : 'area graph'}
                    className='clickable'
                    color='blue'
                    title='Correlation Graph'
                    loading={isActive && props.gettingCorrelationData}
                    disabled={props.gettingCorrelationData}
                    onClick={() => props.seeCorrelationGraph(props.row.gene, props.row.gem)}
                /> */}

                {/* MiRNA-target Interaction */}
                {/* {props.isMiRNA &&
                    <Icon
                        name={isActive && props.gettingMiRNAInteractionData ? 'sync alternate' : 'newspaper'}
                        className='clickable margin-left-5'
                        color='teal'
                        title='MiRNA-target Interaction'
                        loading={isActive && props.gettingMiRNAInteractionData}
                        disabled={props.gettingMiRNAInteractionData}
                        onClick={() => props.seeMiRNAInteraction(props.row.gene, props.row.gem)}
                    />
                } */}

                {/* Disease/Drug associated */}
                {/* {props.isMiRNA &&
                    <Icon
                        name={isActive && props.gettingDiseaseDrugData ? 'sync alternate' : 'lab'}
                        className='clickable margin-left-5'
                        color='green'
                        title='Disease/Drug association'
                        loading={isActive && props.gettingDiseaseDrugData}
                        disabled={props.gettingDiseaseDrugData}
                        onClick={() => props.seeMiRNADiseaseDrug(props.row.gene, props.row.gem)}
                    />
                } */}
            </Table.Cell>
        </Table.Row>
    )
}
