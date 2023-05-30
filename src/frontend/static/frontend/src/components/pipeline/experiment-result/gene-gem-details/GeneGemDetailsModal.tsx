import React from 'react'
import { Modal, Header } from 'semantic-ui-react'
import { CorrelationGraph } from './correlation-graph/CorrelationGraph'
import ky from 'ky'
import { KySearchParams, Nullable, StatChartData } from '../../../../utils/interfaces'
import { DjangoResponseGetCorrelationGraph, DjangoResponseCode, DjangoCorrelationGraphInternalCode, SourceDataStatisticalPropertiesResponse, DjangoMRNAxGEMResultRow, ExperimentType, DjangoMiRNADataJSON, DjangoExperiment } from '../../../../utils/django_interfaces'
import { alertGeneralError, getGeneAndGEMFromSelectedRow } from '../../../../utils/util_functions'
import { findLineByLeastSquares } from './correlation-graph/correlationGraphUtils'
import { MiRNADiseasesPanel } from './MiRNADiseasesPanel'
import { MiRNAInteractionPanel } from './MiRNAInteractionPanel'
import { LoadingPanel } from './LoadingPanel'
import { StatisticalPropertiesPanel } from './stats/StatisticalPropertiesPanel'
import { AssumptionsPanel } from './assumptions/AssumptionsPanel'
import { MiRNADrugsPanel } from './MiRNADrugsPanel'
import { CorrelationBoxplot } from './correlation-boxplot/CorrelationBoxplot'
import { GeneGemModalMenu } from './GeneGemModalMenu'
import { NoClinicalData } from './survival-analysis/NoClinicalData'
import { KaplanMeierChart } from './survival-analysis/KaplanMeier'
import { MiRNATargetInteractionPanel } from './MiRNATargetInteractionPanel'

// Defined in gem.html
declare const urlCorrelationGraph: string
declare const urlGetStatisticalProperties: string
declare const thresholdToConsiderOrdinal: number
declare const urlGetMiRNAData: string
declare const urlClinicalSourceUserFileCRUD: string
declare const urlUnlinkClinicalSourceUserFile: string

/** For reduce function below */
type MergedData = [number, number][]

/**
 * Possible options in menu
 */
enum ActiveItemMenu {
    CORRELATION_GRAPH,
    STATISTICAL_PROPERTIES,
    ASSUMPTIONS,
    MIRNA_TARGET_INTERACTION,
    MIRNA_INTERACTION,
    DISEASES_ASSOCIATION,
    DRUGS_ASSOCIATION,
    SURVIVAL_ANALYSIS
}

/**
 * ApexChart Series structure
 */
interface ApexChartJSSerie {
    name: string,
    data: any[],
    type: 'line' | 'scatter'
}

/** Type to send to the CorrelationGraph component */
type CorrelationChartData = Nullable<{
    series: ApexChartJSSerie[],
    isDataOk: boolean,
    clinicalColumns: string[],
    clinicalValues: string[],
    selectedClinicalGroupBy: Nullable<string>
}>

/** Type to send to the CorrelationBoxplot component */
type CorrelationBoxplotData = Nullable<{
    data: StatChartData[],
    isDataOk: boolean
}>

/**
 * Component's props
 */
interface GeneGemDetailsModalProps {
    /** Current experiment to retrieve some info */
    experiment: DjangoExperiment,
    /** To get the Gene and GEM */
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    /** To show certain options */
    isMiRNA: boolean,
    /** Correlation method description */
    correlationMethodDescription: string,
    /** P-value adjustment method description */
    pValuesAdjustmentMethodDescription: string,
    /** Flag to sho the modal */
    showModal: boolean,
    /** Close callback */
    handleClose: () => void,
    /** Callback to refresh experiment info on clinical source changes */
    refreshExperimentInfo: (experimentId: number) => void
}

/**
 * Component's state
 */
interface GeneGemDetailsModalState {
    /** Active Menu item */
    activeItem: Nullable<ActiveItemMenu>,
    /** Correlation Graph data */
    correlationGraphData: CorrelationChartData,
    /** Data of miRNA */
    miRNAData: Nullable<DjangoMiRNADataJSON>,
    /** Correlation Boxplot data */
    correlationBoxplotData: CorrelationBoxplotData,
    /** Combination Gene x GEM statistical properties */
    statisticalProperties: Nullable<SourceDataStatisticalPropertiesResponse>,
    /** Flag of correlation graph request */
    gettingCorrelationData: boolean,
    /** Flag of statistical properties request */
    gettingStatisticalProperties: boolean,
    /** To check if needs to show Correlation Graph of Correlation Boxplot */
    gemDataIsOrdinal: boolean
}

/**
 * Renders a Gene x GEM details modal
 */
class GeneGemDetailsModal extends React.Component<GeneGemDetailsModalProps, GeneGemDetailsModalState> {
    private loadingComponent: JSX.Element

    constructor (props) {
        super(props)

        // Just in case it's still loading data
        this.loadingComponent = <LoadingPanel />

        this.state = this.getDefaultState()
    }

    /**
     * Generates a default state object
     * @returns Default state object
     */
    getDefaultState (): GeneGemDetailsModalState {
        return {
            activeItem: null,
            correlationGraphData: null,
            miRNAData: null,
            correlationBoxplotData: null,
            statisticalProperties: null,
            gettingCorrelationData: false,
            gettingStatisticalProperties: false,
            gemDataIsOrdinal: false
        }
    }

    /**
     * Handles changes in field to group correlation graph samples
     * @param value New value to set
     */
    handleGroupByChanges = (value: string) => {
        const correlationGraphData = this.state.correlationGraphData
        if (correlationGraphData) {
            correlationGraphData.selectedClinicalGroupBy = value
            this.setState({ correlationGraphData }, this.getCorrelationGraphData)
        }
    }

    /**
     * When component has mounted fires the request to retrieve needed data
     */
    componentDidMount () {
        this.setActiveItem(ActiveItemMenu.STATISTICAL_PROPERTIES)
    }

    /**
     * Restart some field before close
     */
    resetFieldsAndClose = () => { this.setState(this.getDefaultState(), this.props.handleClose) }

    /**
     * Retrieves miRNA data like sequence or accession ID
     */
    getMiRNAData () {
        const searchParams: KySearchParams = {
            mirna: this.props.selectedRow?.gem as string
        }

        ky.get(urlGetMiRNAData, { searchParams }).then((response) => {
            response.json().then((jsonResponse: DjangoMiRNADataJSON) => {
                this.setState({ miRNAData: jsonResponse })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting studies ->', err)
        })
    }

    /**
     * Gets active menu
     * @returns Component
     */
    getActiveComponent () {
        const [gene, gem] = getGeneAndGEMFromSelectedRow(this.props.selectedRow)
        switch (this.state.activeItem) {
            case ActiveItemMenu.CORRELATION_GRAPH:
                if (this.state.gettingCorrelationData) {
                    return this.loadingComponent
                }

                // If the data is ordinal its needed a better chart like Boxplots
                if (this.state.gemDataIsOrdinal) {
                    return <CorrelationBoxplot boxplotData={this.state.correlationBoxplotData} selectedRow={this.props.selectedRow}/>
                }

                return <CorrelationGraph
                    chartData={this.state.correlationGraphData}
                    selectedRow={this.props.selectedRow}
                    handleGroupByChanges={this.handleGroupByChanges}
                />
            case ActiveItemMenu.STATISTICAL_PROPERTIES:
                if (this.state.gettingStatisticalProperties) {
                    return this.loadingComponent
                }
                return <StatisticalPropertiesPanel
                    statisticalProperties={this.state.statisticalProperties}
                    selectedRow={this.props.selectedRow}
                    gemDataIsOrdinal={this.state.gemDataIsOrdinal}
                />
            case ActiveItemMenu.ASSUMPTIONS:
                if (this.state.gettingStatisticalProperties) {
                    return this.loadingComponent
                }
                return <AssumptionsPanel
                    statisticalProperties={this.state.statisticalProperties}
                    selectedRow={this.props.selectedRow}
                    experiment={this.props.experiment}
                />
            case ActiveItemMenu.MIRNA_TARGET_INTERACTION:
                return <MiRNATargetInteractionPanel
                    miRNAData={this.state.miRNAData}
                    gene={gene}
                    miRNA={gem}
                />
            case ActiveItemMenu.MIRNA_INTERACTION:
                // NOTE: it's inside a React.Fragment to force componentDidMount execution
                // in PaginatedTable component. Otherwise, React will see miRNA interaction
                // and miRNA-Target interaction as the same component and won't trigger XHR requests
                return (
                    <React.Fragment>
                        <MiRNAInteractionPanel
                            miRNAData={this.state.miRNAData}
                            miRNA={gem}
                            showGeneSearchInput
                        />
                    </React.Fragment>
                )
            case ActiveItemMenu.DISEASES_ASSOCIATION:
                return <MiRNADiseasesPanel miRNA={gem} miRNAData={this.state.miRNAData}/>
            case ActiveItemMenu.DRUGS_ASSOCIATION:
                return <MiRNADrugsPanel miRNA={gem} miRNAData={this.state.miRNAData}/>
            case ActiveItemMenu.SURVIVAL_ANALYSIS:
                if (!this.props.experiment.clinical_source_id) {
                    return (
                        <NoClinicalData
                            experiment={this.props.experiment}
                            experimentType='correlation'
                            urlClinicalSourceAddOrEdit={urlClinicalSourceUserFileCRUD}
                            urlUnlinkClinicalSource={urlUnlinkClinicalSourceUserFile}
                            refreshExperimentInfo={this.props.refreshExperimentInfo}
                        />
                    )
                }

                return <KaplanMeierChart
                    selectedRow={this.props.selectedRow}
                    experimentId={this.props.experiment.id}
                />
        }
    }

    /**
     * Checks if data should be considered ordinal to show Correlation Graph or Correlation Boxplots
     * @param gemData GEM data to check if is ordinal
     * @returns True if data should be considered ordinal, false otherwise
     */
    checkIfDataIsOrdinal (gemData: number[]): boolean {
        return this.props.experiment.type === ExperimentType.CNA &&
            new Set(gemData).size <= thresholdToConsiderOrdinal
    }

    /**
     * Generates data ready for CorrelationGraph chart
     * @param gene Gene name
     * @param geneData Gene data array
     * @param gem GEM name
     * @param gemData GEM data array
     * @param clinicalData Clinical data array
     * @returns Data ready for CorrelationGraph chart
     */
    generateCorrelationGraphData (gene: string, geneData: number[], gem: string, gemData: number[], clinicalData: string[]): ApexChartJSSerie[] {
        // Generates the new Chart's data
        const lineSerie: ApexChartJSSerie = {
            name: 'Expected correlation',
            data: findLineByLeastSquares(gemData, geneData),
            type: 'line'
        }

        if (!clinicalData.length) {
            const mergedData: MergedData = []
            geneData.forEach((geneValue, idx) => {
                const gemValue = gemData[idx]
                mergedData.push([gemValue, geneValue])
            })

            return [
                {
                    name: `${gem} x ${gene}`,
                    data: mergedData,
                    type: 'scatter'
                },
                lineSerie
            ]
        }

        // Groups by clinical data generating different ApexChartSeries with different colors
        const seriesGrouped: {[clinicalKey: string]: [number, number][]} = {}
        geneData.forEach((geneValue, idx) => {
            const gemValue = gemData[idx]
            const clinicalValue = clinicalData[idx]
            if (!seriesGrouped[clinicalValue]) {
                seriesGrouped[clinicalValue] = []
            }

            seriesGrouped[clinicalValue].push([gemValue, geneValue])
        })

        const series: ApexChartJSSerie[] = Object.entries(seriesGrouped).map((keyAndValues) => {
            return {
                name: keyAndValues[0],
                data: keyAndValues[1],
                type: 'scatter'
            }
        })

        series.push(lineSerie)

        return series
    }

    /**
     * Generates data ready for CorrelationBoxplot chart
     * @param geneData Gene data array
     * @param gemData GEM data array
     * @returns Data ready for CorrelationBoxplot chart
     */
    generateCorrelationBoxplotData (
        geneData: number[],
        gemData: number[]
    ): StatChartData[] {
        // Generates the new Chart's data which is an object of numerical key and values
        type MergedDataBoxplot = {[gemKey: number]: number[]}
        const zippedData: MergedDataBoxplot = {}
        geneData.forEach((geneElem, idx) => {
            const gemKey = gemData[idx] // Gets GEM data for same sample
            if (zippedData[gemKey] === undefined) {
                zippedData[gemKey] = []
            }
            zippedData[gemKey].push(geneElem)
        })

        const res: StatChartData[] = Object.entries(zippedData).map(entry => {
            return { x: entry[0], data: entry[1], strokeColor: '#a97f00' }
        })
        return res
    }

    /**
     * Makes a request and show a correlation graph between a specific
     * gene and GEM
     */
    getCorrelationGraphData = () => {
        // If it's getting the data, prevents multiples requests to the server
        if (this.state.gettingCorrelationData) {
            return
        }

        const [gene, gem] = getGeneAndGEMFromSelectedRow(this.props.selectedRow)

        this.setState({ gettingCorrelationData: true }, () => {
            const searchParams: KySearchParams = {
                experimentId: this.props.experiment.id,
                gene,
                gem
            }

            if (this.state.correlationGraphData?.selectedClinicalGroupBy) {
                searchParams.selectedClinicalGroupBy = this.state.correlationGraphData?.selectedClinicalGroupBy
            }

            ky.get(urlCorrelationGraph, { searchParams, timeout: 60000 }).then((response) => {
                response.json().then((jsonResponse: DjangoResponseGetCorrelationGraph) => {
                    if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                        // For short...
                        const geneData = jsonResponse.data.gene_values
                        const gemData = jsonResponse.data.gem_values

                        const isDataOk = jsonResponse.data.is_data_ok

                        // Check if needs to show CorrelationGraph or CorrelationBoxplot
                        const gemDataIsOrdinal = isDataOk
                            ? this.checkIfDataIsOrdinal(gemData)
                            : false

                        let keyToUpdate: keyof GeneGemDetailsModalState
                        let correlationGraphDataFormatted: CorrelationBoxplotData | CorrelationChartData
                        if (gemDataIsOrdinal) {
                            keyToUpdate = 'correlationBoxplotData'
                            const boxplotData: StatChartData[] = this.generateCorrelationBoxplotData(
                                geneData,
                                gemData
                            )
                            correlationGraphDataFormatted = {
                                data: boxplotData,
                                isDataOk
                            }
                        } else {
                            keyToUpdate = 'correlationGraphData'
                            const correlationGraphData = this.generateCorrelationGraphData(
                                gene,
                                geneData,
                                gem,
                                gemData,
                                jsonResponse.data.clinical_values
                            )

                            correlationGraphDataFormatted = {
                                series: correlationGraphData,
                                isDataOk,
                                clinicalColumns: jsonResponse.data.clinical_columns,
                                clinicalValues: jsonResponse.data.clinical_values,
                                selectedClinicalGroupBy: this.state.correlationGraphData?.selectedClinicalGroupBy ?? null
                            }
                        }

                        this.setState<never>({
                            [keyToUpdate]: correlationGraphDataFormatted,
                            gemDataIsOrdinal,
                            gettingCorrelationData: false // Sets at the same time to prevent old chart being showed before new data
                        })
                    } else {
                        switch (jsonResponse.status.internal_code) {
                            case DjangoCorrelationGraphInternalCode.EXPERIMENT_DOES_NOT_EXISTS:
                                alert('It seems that the experiment does not exist. If you think it\'s an error, please, contact with the administrator')
                                break
                            default:
                                alertGeneralError()
                                break
                        }
                    }
                }).catch((err) => {
                    this.setState({ gettingCorrelationData: false })
                    // If an error ocurred, sets the selected row to null
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ gettingCorrelationData: false })
                // If an error ocurred, sets the selected row to null
                alertGeneralError()
                console.log('Error getting correlation graph ->', err)
            })
        })
    }

    /**
     * Makes a request and show statistical properties between a specific
     * gene and GEM
     */
    getStatisticalProperties = () => {
        // If it's getting the data, prevents multiples requests to the server
        if (this.state.gettingStatisticalProperties || !this.props.selectedRow) {
            return
        }

        this.setState({ gettingStatisticalProperties: true }, () => {
            const url = `${urlGetStatisticalProperties}/${this.props.selectedRow?.id}/`

            const searchParams = {
                experiment_type: this.props.experiment.type
            }

            ky.get(url, { searchParams, timeout: 60000 }).then((response) => {
                response.json().then((statisticalProperties: SourceDataStatisticalPropertiesResponse) => {
                    const gemDataIsOrdinal = statisticalProperties.is_data_ok
                        ? this.checkIfDataIsOrdinal(statisticalProperties.gem_data)
                        : false

                    this.setState({ statisticalProperties, gemDataIsOrdinal })
                }).catch((err) => {
                    // If an error ocurred, sets the selected row to null
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                // If an error ocurred, sets the selected row to null
                alertGeneralError()
                console.log('Error getting correlation graph ->', err)
            }).finally(() => {
                this.setState({ gettingStatisticalProperties: false })
            })
        })
    }

    /**
     * Set the Active Menu item
     * @param activeItem New ActiveItem
     */
    setActiveItem = (activeItem: ActiveItemMenu) => {
        // If we have done the request previously we don't make the request again
        switch (activeItem) {
            case ActiveItemMenu.CORRELATION_GRAPH:
                // NOTE: Refresh the data on every change due to a very rare problem with react-apexcharts
                // breaking the correlation table.
                this.getCorrelationGraphData()
                break
            case ActiveItemMenu.STATISTICAL_PROPERTIES:
            case ActiveItemMenu.ASSUMPTIONS: // NOTE: assumptions panels uses the same info
                if (!this.state.statisticalProperties) {
                    this.getStatisticalProperties()
                }
                break
            case ActiveItemMenu.MIRNA_INTERACTION:
            case ActiveItemMenu.MIRNA_TARGET_INTERACTION:
            case ActiveItemMenu.DRUGS_ASSOCIATION:
            case ActiveItemMenu.DISEASES_ASSOCIATION:
                if (!this.state.miRNAData) {
                    this.getMiRNAData()
                }
                break
        }

        this.setState({ activeItem })
    }

    render () {
        if (!this.props.selectedRow || !this.props.showModal) {
            return null
        }

        const { gene, gem } = this.props.selectedRow

        return (
            <Modal
                id='gene-gem-modal'
                size='fullscreen'
                centered={false} // Top aligned
                closeIcon
                open={this.props.showModal}
                onClose={this.resetFieldsAndClose}
                closeOnDimmerClick={false}
            >
                <Header id='header-details-modal' icon='dna' content={`${gem} x ${gene} details`} />

                <Modal.Content scrolling>
                    <GeneGemModalMenu
                        gene={gene}
                        gem={gem}
                        gemDataIsOrdinal={this.state.gemDataIsOrdinal}
                        isMiRNA={this.props.isMiRNA}
                        correlationMethodDescription={this.props.correlationMethodDescription}
                        pValuesAdjustmentMethodDescription={this.props.pValuesAdjustmentMethodDescription}
                        activeItem={this.state.activeItem}
                        setActiveItem={this.setActiveItem}
                    />

                    {/* Active component */}
                    {this.getActiveComponent()}
                </Modal.Content>
            </Modal>
        )
    }
}

export { GeneGemDetailsModal, CorrelationChartData, CorrelationBoxplotData, ActiveItemMenu, ApexChartJSSerie }
