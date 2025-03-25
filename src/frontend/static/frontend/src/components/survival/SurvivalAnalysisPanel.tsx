import React from 'react'
import { Base } from '../Base'
import { Grid, Segment, DropdownItemProps } from 'semantic-ui-react'
import { FileType, Source, SourceType } from '../../utils/interfaces'
import { getDefaultSource, getFilenameFromSource, getInputFileCSVColumns, listToDropdownOptions } from '../../utils/util_functions'
import { DjangoUserFile, DjangoCGDSStudy } from '../../utils/django_interfaces'
import ky from 'ky'
import { SurvivalForm } from './SurvivalForm'
import { SurvivalGeneSelectionPanel } from './SurvivalGeneSelectionPanel'

declare const urlDatasetColumnName: string

/** Names of Sources in this component's state */
type SourceStateName = 'expressionSource' | 'survivalSource'
type ColumnStateName = 'columnEventTime' | 'columnEventStatus'

/**
 * Component's state
 */
interface SurvivalAnalysisPanelState {
    expressionSource: Source,
    survivalSource: Source,
    expressionFileType: FileType,
    columnEventTime: string,
    columnEventStatus: string
    columnEventOptions: DropdownItemProps[],
    genes: string[],
    selectedGenes: string[]
}

/**
 * Renders a Survival Analysis panel
 * @returns Component
 */
class SurvivalAnalysisPanel extends React.Component<unknown, SurvivalAnalysisPanelState> {
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            expressionSource: getDefaultSource(),
            survivalSource: getDefaultSource(),
            expressionFileType: FileType.MRNA,
            columnEventTime: '',
            columnEventStatus: '',
            columnEventOptions: [],
            genes: [],
            selectedGenes: []
        }
    }

    /**
     * Abort controller if component unmount
     */
    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Set a FileType value in Select component
     * @param value New FileType to change
     */
    changeFileType = (value) => {
        this.setState({ expressionFileType: value })
    }

    /**
     * Handles changes in select in SourceForm
     * @param sourceSelected New selected SourceType
     * @param sourceName Source field's name to update
     */
    handleChangeSourceType = (sourceSelected: SourceType, sourceName: SourceStateName) => {
        const source = this.state[sourceName]
        source.type = sourceSelected
        this.setState<never>({ [sourceName]: source })
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    updateSourceFilenames () {
        // Updates state filenames
        const expressionSource = this.state.expressionSource
        const survivalSource = this.state.survivalSource

        expressionSource.filename = getFilenameFromSource(expressionSource)
        survivalSource.filename = getFilenameFromSource(survivalSource)

        this.setState({ expressionSource, survivalSource })
    }

    /**
     * Transforms a columns' name  array into a DropdownItemProps array for Selects
     * and sets it to the state
     * @param columnNames Column names to transform
     */
    setColumnNamesAsOptions = (columnNames: string[]) => {
        const columnNamesAsOptions: DropdownItemProps[] = listToDropdownOptions(columnNames)
        columnNamesAsOptions.unshift({ key: 'no_selected', text: 'No selected' })
        this.setState({ columnEventOptions: columnNamesAsOptions })
    }

    /**
     * Shows a general error when failed the retrieving of columns names from the Survival Dataset
     */
    alertErrorColumnNames () {
        alert('An error ocurred reading the header of th Survival Source. Please, try uploading it again')
    }

    /**
     * Gets the Survival Dataset columns name
     */
    getColumnName () {
        this.setState({ columnEventOptions: [] })
        const survivalSource = this.state.survivalSource

        switch (survivalSource.type) {
            case SourceType.NEW_DATASET:
                if (survivalSource.newUploadedFileRef.current.files.length) {
                    getInputFileCSVColumns(survivalSource.newUploadedFileRef.current.files[0])
                        .then(this.setColumnNamesAsOptions)
                        .catch((ex) => {
                            this.alertErrorColumnNames()
                            console.log('Error reading CSV column names', ex)
                        })
                }

                break
            case SourceType.UPLOADED_DATASETS:
                this.getColumnsNamesFromServer(false)
                break
            case SourceType.CGDS:
                this.getColumnsNamesFromServer(true)
                break
            default:
                console.log('Invalid SourceType')
                break
        }
    }

    /**
     * Fetches column's names of dataset from server and sets them to the state
     * @param isCGDSStudy Flag to set the corresponding URL, if true, is a CGDStudy, UploadedFile otherwise
     */
    getColumnsNamesFromServer (isCGDSStudy: boolean) {
        const id: number = (isCGDSStudy)
            ? this.state.survivalSource.CGDSStudy?.id as number
            : this.state.survivalSource.selectedExistingFile?.id as number

        const searchParams: {
            sourceId: number,
            sourceType: SourceType
        } = {
            sourceId: id,
            sourceType: this.state.survivalSource.type as SourceType
        }

        ky.get(urlDatasetColumnName, { signal: this.abortController.signal, searchParams }).then((response) => {
            response.json()
                .then((columnNames: string[]) => {
                    this.setColumnNamesAsOptions(columnNames)
                })
                .catch((err) => {
                    this.alertErrorColumnNames()
                    console.log('Error parsing JSON ->', err)
                })
        }).catch((err) => {
            if (!this.abortController.signal.aborted) {
                this.alertErrorColumnNames()
            }

            console.log('Error getting colum names ->', err)
        })
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     * @param sourceName Source field's name of the selected source to bind the new file
     */
    selectNewFile = (sourceName: SourceStateName) => {
        this.takeActionOfSourceSelected(sourceName)
    }

    /**
     * Trigger different actions depending of the recently selected source
     * @param sourceName Recently selected source to check
     */
    takeActionOfSourceSelected (sourceName: SourceStateName) {
        // Independently of the selected Source, we update the filenames
        this.updateSourceFilenames()

        // If it's updating the survival source, gets the columns name to select the event columns
        if (sourceName === 'survivalSource') {
            this.getColumnName()
        } else {
            this.getGenesList()
        }
    }

    /**
     * Gets a list of genes from the selected Expression Dataset
     */
    getGenesList () {
        // TODO: implement!
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceName Source field's name to update
     */
    selectUploadedFile = (selectedFile: DjangoUserFile, sourceName: SourceStateName) => {
        const source: Source = this.state[sourceName]
        source.selectedExistingFile = selectedFile
        this.setState<never>({ [sourceName]: source }, () => {
            this.takeActionOfSourceSelected(sourceName)
        })
    }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceName Source field's name to update
     */
    selectStudy = (selectedStudy: DjangoCGDSStudy, sourceName: SourceStateName) => {
        const source: Source = this.state[sourceName]
        source.CGDSStudy = selectedStudy
        this.setState<never>({ [sourceName]: source }, () => {
            this.takeActionOfSourceSelected(sourceName)
        })
    }

    /**
     * Set the new array of selected genes
     * @param newSelectedGenes Array of genes selected in the Dropdown
     */
    handleGenesChanges = (newSelectedGenes: string[]) => { this.setState({ selectedGenes: newSelectedGenes }) }

    /**
     * Handle changes in the Survival Selects
     * @param name Name of the column State's field to update
     * @param value New selected value in the Select
     */
    selectSurvivalColumn = (name: ColumnStateName, value) => { this.setState<never>({ [name]: value }) }

    render () {
        return (
            <div>
                <Base activeItem='survival' wrapperClass='wrapper'>
                    <Segment>
                        {/* Datasets form */}
                        <Grid columns={3} stackable textAlign='left' divided>
                            <Grid.Column width={2} textAlign='center'>
                                <SurvivalForm
                                    {...this.state}
                                    selectStudy={this.selectStudy}
                                    handleChangeSourceType={this.handleChangeSourceType}
                                    selectUploadedFile={this.selectUploadedFile}
                                    selectSurvivalColumn={this.selectSurvivalColumn}
                                    selectNewFile={this.selectNewFile}
                                    changeFileType={this.changeFileType}
                                />
                            </Grid.Column>

                            {/* Gene selection */}
                            <Grid.Column width={4} textAlign='center'>
                                <SurvivalGeneSelectionPanel
                                    genes={this.state.genes}
                                    selectedGenes={this.state.selectedGenes}
                                    handleGenesChanges={this.handleGenesChanges}
                                />
                            </Grid.Column>
                        </Grid>
                    </Segment>
                </Base>
            </div>
        )
    }
}

export { SurvivalAnalysisPanel, SurvivalAnalysisPanelState, SourceStateName, ColumnStateName }
