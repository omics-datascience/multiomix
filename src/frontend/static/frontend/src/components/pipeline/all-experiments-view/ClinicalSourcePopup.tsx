import ky from 'ky'
import React from 'react'
import { Button, Grid, Icon, Label, Popup } from 'semantic-ui-react'
import { DjangoCommonResponse, DjangoExperiment, DjangoExperimentClinicalSource, DjangoResponseCode, DjangoSurvivalColumnsTupleSimple, DjangoUserFile, ExperimentState } from '../../../utils/django_interfaces'
import { FileType, Nullable, Source, SourceType } from '../../../utils/interfaces'
import { alertGeneralError, cleanRef, experimentSourceIsValid, getDefaultSource, getDjangoHeader, getFilenameFromSource } from '../../../utils/util_functions'
import { SurvivalTuplesForm } from '../../survival/SurvivalTuplesForm'
import { SourceForm } from '../SourceForm'

declare const urlClinicalSourceUserFileCRUD: string
declare const urlUnlinkClinicalSourceUserFile: string

/**
 * Component's props
 */
interface PopupClinicalSourceProps {
    /** Experiment object to send its id and show some info */
    experiment: DjangoExperiment,
    /** Flag to show or hide the Popup */
    showPopup: boolean,
    /** Popup position (optional, 'left center' by default) */
    position?: 'left center' | 'top left' | 'top right' | 'bottom right' | 'bottom left' | 'right center' | 'top center' | 'bottom center' | undefined,
    /** Extra classnames for the icon  */
    iconExtraClassNames?: string,
    /** Flag to retrieve only clinical datasets with at least one survival tuple (if the file type is other than clinical, this parameter is ignores). By default false */
    showOnlyClinicalDataWithSurvivalTuples: boolean,
    /** Open popup callback */
    openPopup: (experimentId: number) => void,
    /** Close popup callback */
    closePopup: () => void,
    /** After add/edit a clinical source popup callback */
    onSuccessCallback: (retryIfNotFound?: boolean) => void,
}

/**
 * Component's state
 */
interface AllExperimentRowState {
    clinicalSource: Source,
    /** Optional survival columns */
    survivalColumns: DjangoSurvivalColumnsTupleSimple[],
    /** State to indicate that it's adding/editing the clinical source */
    addingOrEditingSource: boolean,
    /** State to indicate that it's unlinking the clinical source */
    unlinkingSource: boolean,
    /** State to indicate that it's retrieving the clinical source */
    gettingSourceData: boolean,
    /** To check if it's a CGDSDataset as a clinical value */
    cgdsStudyName: Nullable<string>
}

/**
 * Renders an icon with opens a Popup to manage clinical source for an experiment on the fly
 */
export class ClinicalSourcePopup extends React.Component<PopupClinicalSourceProps, AllExperimentRowState> {
    constructor (props) {
        super(props)

        this.state = {
            clinicalSource: getDefaultSource(),
            survivalColumns: [],
            addingOrEditingSource: false,
            gettingSourceData: false,
            unlinkingSource: false,
            cgdsStudyName: null
        }
    }

    /**
     * Opens the popup to add/edit clinical source retrieving source data (if exists)
     */
    openPopup = () => {
        if (this.props.experiment.clinical_source_id) {
            this.getSourceData()
        }

        this.props.openPopup(this.props.experiment.id)
    }

    /**
     * Closes the popup to add/edit clinical source
     */
    closePopup = () => {
        this.props.closePopup()
        this.setState({
            clinicalSource: getDefaultSource(),
            survivalColumns: []
        })
    }

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     */
    handleChangeSourceType = (sourceType: SourceType) => {
        const clinicalSource = this.state.clinicalSource
        clinicalSource.type = sourceType

        // Resets all source values
        clinicalSource.selectedExistingFile = null
        clinicalSource.CGDSStudy = null
        cleanRef(clinicalSource.newUploadedFileRef)

        this.setState({ clinicalSource }, this.updateSourceFilenames)
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    updateSourceFilenames = () => {
        // Updates state filenames
        const clinicalSource = this.state.clinicalSource

        clinicalSource.filename = getFilenameFromSource(clinicalSource)

        this.setState({ clinicalSource })
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    selectNewFile = () => {
        this.updateSourceFilenames()
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     */
    selectUploadedFile = (selectedFile: DjangoUserFile) => {
        const clinicalSource = this.state.clinicalSource

        clinicalSource.type = SourceType.UPLOADED_DATASETS
        clinicalSource.selectedExistingFile = selectedFile

        // After update state
        this.setState({ clinicalSource }, this.updateSourceFilenames)
    }

    /**
     * Parse a Source considering its type to send specific parameters to the backend
     * @param formData FormData object to append request parameters
     */
    makeSourceAndAppend (formData: FormData) {
        // In this function source.type is never null
        const source = this.state.clinicalSource
        const sourceType = source.type as SourceType
        const sourceRef = source.newUploadedFileRef.current
        const existingFilePk = sourceType === SourceType.UPLOADED_DATASETS && source.selectedExistingFile?.id
            ? source.selectedExistingFile.id.toString()
            : null

        const file = sourceType === SourceType.NEW_DATASET && sourceRef && sourceRef.files.length > 0 ? sourceRef.files[0] : null

        // Appends to the form data
        formData.append('clinicalType', sourceType ? sourceType.toString() : 'null')
        formData.append('clinicalExistingFilePk', existingFilePk ?? '')
        formData.append('clinicalFile', file)
    }

    /**
     * Checks if the Source form is valid for submission
     * @returns True if form is valid to add/edit clinical source, false otherwise
     */
    canAddOrEdit (): boolean {
        return !this.state.addingOrEditingSource &&
            experimentSourceIsValid(this.state.clinicalSource)
    }

    /**
     * Retrieves existing source data
     */
    unlinkClinicalSource = () => {
        if (!this.props.experiment.clinical_source_id || this.state.unlinkingSource) {
            return
        }

        this.setState({ unlinkingSource: true }, () => {
            const myHeaders = getDjangoHeader()

            const url = `${urlUnlinkClinicalSourceUserFile}/${this.props.experiment.id}/`
            ky.patch(url, { headers: myHeaders }).then((response) => {
                response.json().then((response: DjangoCommonResponse) => {
                    if (response.status.code === DjangoResponseCode.SUCCESS) {
                        this.successfulRequest()
                    } else {
                        alertGeneralError()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            }).finally(() => {
                this.setState({ unlinkingSource: false })
            })
        })
    }

    /**
     * Retrieves existing source data
     */
    getSourceData () {
        if (!this.props.experiment.clinical_source_id) {
            return
        }

        this.setState({ gettingSourceData: true }, () => {
            const url = `${urlClinicalSourceUserFileCRUD}/${this.props.experiment.clinical_source_id}`
            ky.get(url).then((response) => {
                response.json().then((clinicalSource: DjangoExperimentClinicalSource) => {
                    if (clinicalSource && clinicalSource.id) {
                        this.setState({
                            clinicalSource: {
                                id: clinicalSource.id,
                                filename: '', // Will be completed after this
                                newUploadedFileRef: React.createRef(), // Ref is not possible as it's getting a UserFile from backend
                                CGDSStudy: null, // CGDSStudy is not needed for clinical data for a user file
                                type: SourceType.UPLOADED_DATASETS,
                                selectedExistingFile: clinicalSource.user_file
                            },
                            cgdsStudyName: clinicalSource.cgds_dataset?.name ?? null
                        }, this.updateSourceFilenames)
                    } else {
                        alertGeneralError()
                        this.closePopup()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    this.closePopup()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                this.closePopup()
                console.log('Error adding new Tag ->', err)
            }).finally(() => {
                this.setState({ gettingSourceData: false })
            })
        })
    }

    /**
     * Closes the popup and retrieves updated data
     */
    successfulRequest () {
        // NOTE: closing popup includes cleaning the Source object
        this.closePopup()
        this.props.onSuccessCallback()
    }

    /**
     * Submits selected clinical source
     */
    addOrEdit = () => {
        if (!this.canAddOrEdit()) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // Request needs the experiment id to associate it with the new clinical source
        const formData = new FormData()
        formData.append('experimentPk', this.props.experiment.id.toString())

        // Adds the survival columns tuples, if needed
        if (this.state.survivalColumns.length > 0) {
            formData.append('survival_columns', JSON.stringify(this.state.survivalColumns))
        }

        // Appends Source data to FormData
        this.makeSourceAndAppend(formData)

        this.setState({ addingOrEditingSource: true }, () => {
            ky.post(urlClinicalSourceUserFileCRUD, { headers: myHeaders, body: formData }).then((response) => {
                response.json().then((clinicalSource: DjangoExperimentClinicalSource) => {
                    if (clinicalSource && clinicalSource.id) {
                        this.successfulRequest()
                    } else {
                        alertGeneralError()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            }).finally(() => {
                this.setState({ addingOrEditingSource: false })
            })
        })
    }

    /**
     * This is not needed for clinical data
     */
    selectStudy () { }

    /**
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (idxSurvivalTuple: number, name: string, value: any) => {
        const survivalColumns = this.state.survivalColumns
        survivalColumns[idxSurvivalTuple][name] = value
        this.setState({ survivalColumns })
    }

    /**
     * Adds a Survival data tuple
     */
    addSurvivalFormTuple = () => {
        const survivalColumns = this.state.survivalColumns
        const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }
        survivalColumns.push(newElement)
        this.setState({ survivalColumns })
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (idxSurvivalTuple: number) => {
        const survivalColumns = this.state.survivalColumns
        survivalColumns.splice(idxSurvivalTuple, 1)
        this.setState({ survivalColumns })
    }

    render () {
        const experiment = this.props.experiment // For short

        const isProcessing = this.state.gettingSourceData ||
            this.state.addingOrEditingSource ||
            this.state.unlinkingSource

        const isAnUploadedDataset = this.state.clinicalSource.type === SourceType.UPLOADED_DATASETS
        const isaNewDataset = this.state.clinicalSource.type === SourceType.NEW_DATASET
        const showSurvivalTuplesForm = isAnUploadedDataset || isaNewDataset
        const clinicalIsDisabled = experiment.state !== ExperimentState.COMPLETED || experiment.result_final_row_count === 0
        const clinicalButtonClassName = clinicalIsDisabled
            ? ''
            : 'clickable ' + this.props.iconExtraClassNames ?? ''

        return (
            <Popup
                id='clinical-source-popup'
                on='click'
                position={this.props.position ?? 'left center'}
                wide='very'
                size='large'
                open={this.props.showPopup}
                onOpen={this.openPopup}
                trigger={
                    <Icon
                        title={`Analysis has${!experiment.clinical_source_id ? ' not' : ''} clinical data`}
                        name={'file'}
                        className={clinicalButtonClassName}
                        color={experiment.clinical_source_id ? 'blue' : 'grey'}
                        disabled={clinicalIsDisabled}
                    />
                }
            >
                <React.Fragment>
                    {/* If it's a CGDSDataset as clinical source it can't be edited */}
                    {this.state.cgdsStudyName ? (
                        <Label color='green'>{this.state.cgdsStudyName}</Label>
                    ) : (
                        <Grid divided columns='equal'>
                            <Grid.Column>
                                <SourceForm
                                    source={this.state.clinicalSource}
                                    showOnlyClinicalDataWithSurvivalTuples={this.props.showOnlyClinicalDataWithSurvivalTuples}
                                    headerTitle='Clinical Data'
                                    headerIcon={{
                                        type: 'icon',
                                        src: 'file'
                                    }}
                                    disabled={isProcessing}
                                    fileType={FileType.CLINICAL}
                                    showCBioPortalOption={false}
                                    tagOptions={[]}
                                    handleChangeSourceType={this.handleChangeSourceType}
                                    selectNewFile={this.selectNewFile}
                                    selectUploadedFile={this.selectUploadedFile}
                                    selectStudy={this.selectStudy}
                                />

                                <Button
                                    color='green'
                                    fluid
                                    className='margin-top-2'
                                    loading={this.state.addingOrEditingSource}
                                    onClick={this.addOrEdit}
                                    disabled={isProcessing || !this.canAddOrEdit()}
                                >
                                    Submit
                                </Button>
                            </Grid.Column>

                            {/* If it's a New Dataset, we give the opportunity to add Survival columns too */}
                            {showSurvivalTuplesForm &&
                                <Grid.Column>
                                    <SurvivalTuplesForm
                                        survivalColumns={isaNewDataset
                                            ? this.state.survivalColumns
                                            : this.state.clinicalSource.selectedExistingFile?.survival_columns as DjangoSurvivalColumnsTupleSimple[]}
                                        disabled={isAnUploadedDataset || this.state.addingOrEditingSource}
                                        loading={this.state.addingOrEditingSource}
                                        handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                        addSurvivalFormTuple={this.addSurvivalFormTuple}
                                        removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                    />
                                </Grid.Column>
                            }
                        </Grid>
                    )}

                    <Button
                        color='red'
                        fluid
                        className='margin-top-2'
                        onClick={this.closePopup}
                        disabled={isProcessing}
                    >
                        {this.state.cgdsStudyName ? 'Close' : 'Cancel'}
                    </Button>

                    {/* Unlink button (only for UserFiles) */}
                    {this.state.clinicalSource.id && !this.state.cgdsStudyName &&
                        <Button
                            color='orange'
                            fluid
                            title='Unlink clinical dataset from this experiment'
                            className='margin-top-2'
                            loading={this.state.unlinkingSource}
                            onClick={this.unlinkClinicalSource}
                            disabled={isProcessing}
                        >
                            Unlink
                        </Button>
                    }
                </React.Fragment>
            </Popup>
        )
    }
}
