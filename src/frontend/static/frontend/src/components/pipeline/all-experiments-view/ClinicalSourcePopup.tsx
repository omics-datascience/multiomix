import ky from 'ky'
import React from 'react'
import { Button, Grid, Icon, Label, Popup } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoCommonResponse, DjangoExperiment, DjangoExperimentClinicalSource, DjangoExperimentSource, DjangoNumberSamplesInCommonClinicalValidationResult, DjangoResponseCode, DjangoSurvivalColumnsTupleSimple, DjangoUserFile, ExperimentState } from '../../../utils/django_interfaces'
import { CustomAlert, CustomAlertTypes, FileType, KySearchParams, Nullable, Source, SourceType } from '../../../utils/interfaces'
import { alertGeneralError, cleanRef, experimentSourceIsValid, getDefaultSource, getDjangoHeader, getFilenameFromSource, getFileSizeInMB, getInputFileCSVColumns, getInputFileCSVFirstColumnAllRows, makeSourceAndAppend } from '../../../utils/util_functions'
import { SurvivalTuplesForm } from '../../survival/SurvivalTuplesForm'
import { SourceForm } from '../SourceForm'
import { BiomarkerState, InferenceExperimentForTable } from '../../biomarkers/types'
import { MAX_FILE_SIZE_IN_MB_WARN } from '../../../utils/constants'
import { Alert } from '../../common/Alert'

declare const urlClinicalSourceUserFileCRUD: string
declare const urlGetCommonSamplesClinical: string
declare const urlGetCommonSamplesClinicalSource: string

/**
 * ValidationSource to add clinical source
 */
export interface ValidationSource {
    gem_source: DjangoExperimentSource,
    mRNA_source: DjangoExperimentSource,
}

/**
 * Component's props
 */
interface PopupClinicalSourceProps {
    /** Experiment/InferenceExperiment instance to send its id and show some info */
    experiment: DjangoExperiment | InferenceExperimentForTable,
    /** To know if it's an experiment or an inference experiment and make some checks. */
    experimentType: 'correlation' | 'inference',
    /** Flag to show or hide the Popup */
    showPopup: boolean,
    /** Popup position (optional, 'left center' by default) */
    position?: 'left center' | 'top left' | 'top right' | 'bottom right' | 'bottom left' | 'right center' | 'top center' | 'bottom center' | undefined,
    /** Extra classnames for the icon  */
    iconExtraClassNames?: string,
    /** Flag to retrieve only clinical datasets with at least one survival tuple (if the file type is other than clinical, this parameter is ignores). By default false */
    showOnlyClinicalDataWithSurvivalTuples: boolean,
    /** URL to add/edit a clinical dataset. */
    urlClinicalSourceAddOrEdit: string,
    /** URL to unlink the clinical dataset. */
    urlUnlinkClinicalSource: string,
    /** If false it doesn't show the option to select a cBioPortal study (false by default) */
    showCBioPortalOption?: boolean,
    /** Open popup callback */
    openPopup: (experimentId: number) => void,
    /** Close popup callback */
    closePopup: () => void,
    /** After add/edit a clinical source popup callback */
    onSuccessCallback: (retryIfNotFound?: boolean) => void,
    /** Validation source to add clinical */
    validationSource: Nullable<ValidationSource>,
}

/**
 * Component's state
 */
interface ClinicalSourceState {
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
    cgdsStudyName: Nullable<string>,
    /** Alert interface */
    alert: CustomAlert,
    /** Posibles values for survival tuple */
    survivalTuplesPossiblesValues: string[] | undefined,
}

/**
 * Renders an icon with opens a Popup to manage clinical source for an experiment on the fly
 */
export class ClinicalSourcePopup extends React.Component<PopupClinicalSourceProps, ClinicalSourceState> {
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            clinicalSource: getDefaultSource(),
            survivalColumns: [],
            addingOrEditingSource: false,
            gettingSourceData: false,
            unlinkingSource: false,
            cgdsStudyName: null,
            alert: this.getDefaultAlertProps(),
            survivalTuplesPossiblesValues: []
        }
    }

    /**
     * Abort controller if component unmount
     */
    componentWillUnmount () {
        this.abortController.abort()
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
        const survivalColumns = []

        this.setState({ clinicalSource, survivalColumns }, this.updateSourceFilenames)
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
        const clinicalSource = this.state.clinicalSource

        if (this.props.validationSource !== null) {
            const { mRNA_source, gem_source } = this.props.validationSource
            const mRNASourceId = mRNA_source.user_file.id
            const gemSourceId = gem_source.user_file.id
            clinicalSource.filename = getFilenameFromSource(clinicalSource)
            const fileSizeInMB = getFileSizeInMB(clinicalSource.newUploadedFileRef.current.files[0].size)

            if (fileSizeInMB < MAX_FILE_SIZE_IN_MB_WARN) {
                const file = clinicalSource.newUploadedFileRef.current.files[0]
                getInputFileCSVFirstColumnAllRows(file, undefined).then((firstColumnAllRows) => {
                    getInputFileCSVColumns(file, undefined).then((headersColumnsNames) => {
                        // Sets the Request's Headers
                        const myHeaders = getDjangoHeader()
                        // Sends an array of headers to compare in server
                        const jsonData = {
                            clinicalData: firstColumnAllRows,
                            mRNASourceId,
                            mRNASourceType: SourceType.UPLOADED_DATASETS,
                            gemSourceId,
                            gemSourceType: SourceType.UPLOADED_DATASETS
                        }

                        ky.post(urlGetCommonSamplesClinicalSource, { json: jsonData, headers: myHeaders }).then((response) => {
                            response.json().then((jsonResponse: DjangoNumberSamplesInCommonClinicalValidationResult) => {
                                if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                                    if (jsonResponse.data.number_samples_in_common > 0) {
                                        this.setState({
                                            clinicalSource,
                                            survivalTuplesPossiblesValues: headersColumnsNames
                                        })
                                    } else {
                                        this.clinicalSourceVoid()
                                    }
                                }
                            }).catch((err) => {
                                console.log('Error parsing JSON ->', err)
                            })
                        }).catch((err) => {
                            console.log('Error getting samples in common', err)
                        })
                    })
                })
            }
        }
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     */
    selectUploadedFile = (selectedFile: DjangoUserFile) => {
        const clinicalSource = this.state.clinicalSource

        if (this.props.validationSource !== null) {
            const { mRNA_source, gem_source } = this.props.validationSource

            const mRNASourceId = mRNA_source.user_file.id
            const gemSourceId = gem_source.user_file.id

            if (mRNASourceId !== null && gemSourceId !== null) {
                const searchParams = {
                    mRNASourceId,
                    mRNASourceType: SourceType.UPLOADED_DATASETS,
                    gemSourceId,
                    gemSourceType: SourceType.UPLOADED_DATASETS,
                    gemFileType: FileType.MIRNA,
                    clinicalSourceId: selectedFile.id,
                    clinicalSourceType: SourceType.UPLOADED_DATASETS
                }

                ky.get(urlGetCommonSamplesClinical, { signal: this.abortController.signal, searchParams: searchParams as KySearchParams }).then((response) => {
                    response.json().then((jsonResponse: DjangoNumberSamplesInCommonClinicalValidationResult) => {
                        if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                            if (jsonResponse.data.number_samples_in_common > 0) {
                                clinicalSource.type = SourceType.UPLOADED_DATASETS
                                clinicalSource.selectedExistingFile = selectedFile
                                const survivalColumns = selectedFile.survival_columns || []
                                const survivalTuplesPossiblesValues = undefined
                                this.setState({ clinicalSource, survivalColumns, survivalTuplesPossiblesValues }, this.updateSourceFilenames)
                            } else {
                                this.clinicalSourceVoid()
                            }
                        }
                    }).catch((err) => {
                        console.log('Error parsing JSON ->', err)
                    })
                }).catch((err) => {
                    console.log('Error getting user experiments', err)
                })
            }
        } else {
            // If there's no validation source, we just set the selected file
            clinicalSource.type = SourceType.UPLOADED_DATASETS
            clinicalSource.selectedExistingFile = selectedFile

            const survivalColumns = selectedFile.survival_columns ?? []
            this.setState({ clinicalSource, survivalColumns }, this.updateSourceFilenames)
        }
    }

    /**
     * Clean clinicalSource and alert
     */
    clinicalSourceVoid () {
        const alert = {
            message: 'No samples in common',
            isOpen: true,
            type: CustomAlertTypes.WARNING,
            duration: 500
        }
        const clinicalSource = {
            type: 0,
            filename: 'Choose File',
            newUploadedFileRef: {
                current: null
            },
            selectedExistingFile: null,
            CGDSStudy: null
        }
        this.setState({
            alert,
            clinicalSource
        })
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

            // TODO: add type of experiment
            const url = `${this.props.urlUnlinkClinicalSource}/${this.props.experiment.id}/`
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
     * Retrieves existing source data.
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
                if (!this.abortController.signal.aborted) {
                    alertGeneralError()
                    this.closePopup()
                }

                console.log('Error adding new Tag ->', err)
            }).finally(() => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ gettingSourceData: false })
                }
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
     * Validate survivals columns are corrected formatted.
     * @returns boolean validation return true if correct
     */
    validateSurvivalsColumnsComplete (): boolean {
        return !this.state.survivalColumns.some((item) => item.event_column.trim().length === 0 || item.time_column.trim().length === 0)
    }

    /**
     * Submits selected clinical source
     */
    addOrEdit = () => {
        // Check the survival columns tuples.
        if (!this.canAddOrEdit() || !this.validateSurvivalsColumnsComplete()) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // Request needs the experiment id to associate it with the new clinical source
        const formData = new FormData()
        formData.append('experimentPk', this.props.experiment.id.toString())

        // Appends Source data to FormData
        makeSourceAndAppend(this.state.clinicalSource, formData, 'clinical')

        this.setState({ addingOrEditingSource: true }, () => {
            ky.post(this.props.urlClinicalSourceAddOrEdit, { headers: myHeaders, body: formData }).then((response) => {
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
                console.log('Error adding new ClinicalUserFile ->', err)
            }).finally(() => {
                this.setState({ addingOrEditingSource: false })
            })
        })
    }

    /**
     * Handles CGDS Dataset selection.
     * @param selectedStudy Selected CGDS Study
     */
    selectStudy = (selectedStudy: DjangoCGDSStudy) => {
        const clinicalSource = this.state.clinicalSource
        clinicalSource.CGDSStudy = selectedStudy
        clinicalSource.type = SourceType.CGDS
        this.setState({ clinicalSource }, this.updateSourceFilenames)
    }

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

    /**
     * Reset the confirm modal, to be used again
     */
    handleCloseAlert = () => {
        const alert = this.state.alert
        alert.isOpen = false
        this.setState({ alert })
    }

    /**
     * Generates a default alert structure
     * @returns Default the default Alert
     */
    getDefaultAlertProps = (): CustomAlert => {
        return {
            message: '', // This have to change during cycle of component
            isOpen: false,
            type: CustomAlertTypes.SUCCESS,
            duration: 500
        }
    }

    render () {
        const experiment = this.props.experiment // For short

        const isProcessing = this.state.gettingSourceData ||
            this.state.addingOrEditingSource ||
            this.state.unlinkingSource

        const isAnUploadedDataset = this.state.clinicalSource.type === SourceType.UPLOADED_DATASETS
        const isaNewDataset = this.state.clinicalSource.type === SourceType.NEW_DATASET
        const showSurvivalTuplesForm = isAnUploadedDataset || isaNewDataset

        let clinicalIsDisabled: boolean

        if (this.props.experimentType === 'correlation') {
            const correlationExperiment = this.props.experiment as DjangoExperiment
            clinicalIsDisabled = correlationExperiment.result_final_row_count === 0 || correlationExperiment.state !== ExperimentState.COMPLETED
        } else {
            clinicalIsDisabled = experiment.state !== BiomarkerState.COMPLETED
        }

        const survColumnsAreComplete = !this.validateSurvivalsColumnsComplete()
        const iconExtraClassNames = this.props.iconExtraClassNames ?? ''
        const clinicalButtonClassName = clinicalIsDisabled
            ? iconExtraClassNames
            : 'clickable ' + iconExtraClassNames
        return (
            <>
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
                            name="file"
                            className={clinicalButtonClassName}
                            color={experiment.clinical_source_id ? 'blue' : 'grey'}
                            disabled={clinicalIsDisabled}
                        />
                    }
                >
                    <React.Fragment>
                        {/* If it's a CGDSDataset as clinical source it can't be edited */}
                        {this.state.cgdsStudyName
                            ? <Label color='green'>{this.state.cgdsStudyName}</Label>
                            : (
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
                                            showCBioPortalOption={this.props.showCBioPortalOption ?? false}
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
                                            disabled={isProcessing || !this.canAddOrEdit() || survColumnsAreComplete}
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
                                                survivalTuplesPossiblesValues={this.state.survivalTuplesPossiblesValues}
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
                <Alert
                    onClose={this.handleCloseAlert}
                    isOpen={this.state.alert.isOpen}
                    message={this.state.alert.message}
                    type={this.state.alert.type}
                    duration={this.state.alert.duration}
                />
            </>
        )
    }
}
