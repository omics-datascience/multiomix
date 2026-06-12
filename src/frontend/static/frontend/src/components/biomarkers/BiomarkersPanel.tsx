import React from 'react'
import { Base } from '../Base'
import { Header, Button, Modal, Table, DropdownItemProps, Icon, Confirm, Form, Grid } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoMethylationPlatform, DjangoTag, DjangoUserFile, TagType } from '../../utils/django_interfaces'
import ky, { Options } from 'ky'
import { getDjangoHeader, alertGeneralError, formatDateLocale, cleanRef, getFilenameFromSource, makeSourceAndAppend, getDefaultSource, getDefaultNewTag, copyObject } from '../../utils/util_functions'
import { Nullable, CustomAlert, CustomAlertTypes, SourceType, OkResponse, ConfirmModal, FileType } from '../../utils/interfaces'
import { Biomarker, BiomarkerType, BiomarkerOrigin, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection, SaveBiomarkerStructure, SaveMoleculeStructure, FeatureSelectionPanelData, SourceStateBiomarker, FeatureSelectionAlgorithm, FitnessFunction, FitnessFunctionParameters, BiomarkerState, AdvancedAlgorithm as AdvancedAlgorithmParameters, BBHAVersion, BiomarkerSimple } from './types'
import { ManualForm } from './modalContentBiomarker/manualForm/ManualForm'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'
import { isEqual } from 'lodash'
import { BiomarkerTypeSelection } from './modalContentBiomarker/biomarkerTypeSelection/BiomarkerTypeSelection'
import { FeatureSelectionPanel } from './modalContentBiomarker/featureSelectionPanel/FeatureSelectionPanel'
import { Alert } from '../common/Alert'
import { BiomarkerStateLabel } from './labels/BiomarkerStateLabel'
import { BiomarkerOriginLabel } from './BiomarkerOriginLabel'
import { BiomarkerDetailsModal } from './BiomarkerDetailsModal'
import { getDefaultClusteringParameters, getDefaultRFParameters, getDefaultSvmParameters, getNumberOfMoleculesOfBiomarker } from './utils'
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'
import { DeleteButton } from '../common/DeleteButton'
import { SharedUsersBiomarker, SharedUsersBiomarkerPropsExtend } from './SharedUsersBiomarker'
import { SharedInstitutionsBiomarker, SharedInstitutionsBiomarkerPropsExtend } from './SharedInstitutionsBiomarker'
import { EditBiomarkerIcon } from './EditBiomarkerIcon'
import { SwitchPublicButton } from '../common/SwitchPublicButton'
import { PopupIcons } from '../common/PopupIcons'
import { TagsPanel } from '../files-manager/TagsPanel'
import { NewFile } from '../files-manager/FilesManager'

// URLs defined in biomarkers.html
declare const urlBiomarkersCRUD: string
declare const urlBiomarkersSimpleUpdate: string
declare const urlBiomarkersCreate: string
declare const urlTagsCRUD: string
declare const urlGeneSymbols: string
declare const urlGeneSymbolsFinder: string
declare const urlMiRNACodes: string
declare const urlMiRNACodesFinder: string
declare const urlMethylationSites: string
declare const urlMethylationSitesFinder: string
declare const urlFeatureSelectionSubmit: string
declare const maxFeaturesBlindSearch: number
declare const minFeaturesMetaheuristics: number
declare const urlCloneBiomarker: string
declare const urlStopFSExperiment: string

const REQUEST_TIMEOUT = 120000 // 2 minutes in milliseconds
const FILE_INPUT_LABEL = 'Add a new file'
/** A matched molecule with the search query and the validated alias. */
type MoleculeFinderResult = { molecule: string, standard: string }

/** Extremely simple struct of a Biomarker (useful for simple updates). */
type BiomarkerNameAndDesc = {
    name: string,
    description: string,
    tag?: { id: number } | null
}

/** Some flags to validate the Biomarkers form. */
type ValidationForm = {
    haveAmbiguous: boolean,
    haveInvalid: boolean
}

/** BiomarkersPanel's state */
interface BiomarkersPanelState {
    /** PK of the Biomarker that's being loaded. */
    loadingFullBiomarkerId: Nullable<number>,
    selectedBiomarkerToDeleteOrSync: Nullable<BiomarkerSimple>,
    checkedIgnoreProposedAlias: boolean,
    showDeleteBiomarkerModal: boolean,
    /** Indicates if there's a Biomarker being deleted. */
    deletingBiomarker: boolean,
    /** Indicates if there's a Biomarker being stopped. */
    stoppingExperiment: boolean,
    newTag: DjangoTag,
    selectedTagToDelete: Nullable<DjangoTag>,
    addingTag: boolean,
    /** Biomarker to stop. */
    biomarkerToStop: Nullable<BiomarkerSimple>,
    addingOrEditingBiomarker: boolean,
    biomarkerTypeSelected: BiomarkerOrigin,
    formBiomarker: FormBiomarkerData,
    confirmModal: ConfirmModal
    tags: DjangoTag[],
    /** Indicates if the modal to create or edit a Biomarker is open. */
    openCreateEditBiomarkerModal: boolean,
    /** Indicates if the modal to clone a Biomarker is open. Contains the pk of the Biomarker to clone. */
    biomarkerToClone: Nullable<BiomarkerSimple>,
    /** Indicates if there's a Biomarker being cloned. */
    cloningBiomarker: boolean,
    /** Indicates if the modal to get the details of a Biomarker is open. */
    openDetailsModal: boolean,
    /** Selected Biomarker instance to show its details. */
    selectedBiomarker: Nullable<Biomarker>,
    /** Alert structure to display messages. */
    alert: CustomAlert,
    featureSelection: FeatureSelectionPanelData,
    submittingFSExperiment: boolean,
    /** modal to handle shared institutions */
    modalInstitutions: SharedInstitutionsBiomarkerPropsExtend,
    /** modal to handle shared users */
    modalUsers: SharedUsersBiomarkerPropsExtend,
    newFile: NewFile,
    showDeleteTagModal: boolean,
    deletingTag: boolean,
}

/**
 * Renders a CRUD panel for a Biomarker.
 */
export class BiomarkersPanel extends React.Component<unknown, BiomarkersPanelState> {
    abortController = new AbortController()
    constructor (props) {
        super(props)

        this.state = {
            loadingFullBiomarkerId: null,
            biomarkerTypeSelected: BiomarkerOrigin.BASE,
            checkedIgnoreProposedAlias: false,
            showDeleteBiomarkerModal: false,
            stoppingExperiment: false,
            biomarkerToStop: null,
            selectedBiomarkerToDeleteOrSync: null,
            deletingBiomarker: false,
            addingOrEditingBiomarker: false,
            formBiomarker: this.getDefaultFormBiomarker(),
            selectedTagToDelete: null,
            confirmModal: this.getDefaultConfirmModal(),
            tags: [],
            openCreateEditBiomarkerModal: false,
            cloningBiomarker: false,
            biomarkerToClone: null,
            openDetailsModal: false,
            selectedBiomarker: null,
            alert: this.getDefaultAlertProps(),
            featureSelection: this.getDefaultFeatureSelectionProps(),
            submittingFSExperiment: false,
            newTag: getDefaultNewTag(),
            addingTag: false,
            modalInstitutions: this.defaultModalInstitutions(),
            modalUsers: this.defaultModalUsers(),
            newFile: this.getDefaultNewFile(),
            showDeleteTagModal: false,
            deletingTag: false,
        }
    }

    /**
     * Abort controller if component is render
     */
    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * default modal institution
     */
    handleCloseModalModalInstitution = () => {
        this.setState({ modalInstitutions: this.defaultModalInstitutions() })
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewFile (): NewFile {
        return {
            newFileName: FILE_INPUT_LABEL,
            newFileNameUser: '',
            newFileDescription: '',
            newFileType: FileType.MRNA,
            newTag: null,
            institutions: [],
            isCpGSiteId: false,
            platform: DjangoMethylationPlatform.PLATFORM_450,
            survivalColumns: []
        }
    }

    /**
     * default modal institution
     * @returns default modal shared institution object
     */
    defaultModalInstitutions = (): SharedInstitutionsBiomarkerPropsExtend => {
        return {
            isOpen: false,
            institutions: [],
            biomarkerId: 0,
            isAdding: false,
            user: {
                id: 0,
                username: ''
            }
        }
    }

    /**
     * default modal user
     * @returns default modal shared user object
     */
    defaultModalUsers (): SharedUsersBiomarkerPropsExtend {
        return {
            isOpen: false,
            users: [],
            biomarkerId: 0,
            isAdding: false,
            user: {
                id: 0,
                username: ''
            }
        }
    }

    /**
     * default modal user
     */
    handleCloseModalModalUser = () => {
        this.setState({ modalUsers: this.defaultModalUsers() })
    }

    /**
     * When the component has been mounted, It requests for
     * tags and files.
     */
    componentDidMount () {
        this.getUserTags()
    }

    /**
     * Generates default feature selection creation structure
     * @returns Default the default Alert
     */
    getDefaultFeatureSelectionProps = (): FeatureSelectionPanelData => {
        return {
            step: 1,
            biomarker: null,
            selectedBiomarker: null,
            clinicalSource: getDefaultSource(),
            mRNASource: getDefaultSource(),
            mirnaSource: getDefaultSource(),
            methylationSource: getDefaultSource(),
            cnaSource: getDefaultSource(),
            algorithm: FeatureSelectionAlgorithm.BLIND_SEARCH,
            fitnessFunction: FitnessFunction.CLUSTERING,
            fitnessFunctionParameters: this.getDefaultFitnessFunctionParameters(),
            advancedAlgorithmParameters: this.getDefaultAdvancedAlgorithmParameters(),
            crossValidationParameters: { folds: 10 }
        }
    }

    /** Makes a request to stop an FSExperiment. */
    stopFSExperiment = () => {
        if (this.state.biomarkerToStop === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const biomarkerId = this.state.biomarkerToStop.id as number // This is safe
        this.setState({ stoppingExperiment: true }, () => {
            ky.get(urlStopFSExperiment, {
                headers: myHeaders,
                searchParams: { biomarkerId }
            }).then((response) => {
                // If OK closes the modal
                if (response.ok) {
                    this.setState({ biomarkerToStop: null })
                } else {
                    alertGeneralError()
                }
            }).catch((err) => {
                alertGeneralError()
                console.log('Error stopping FSExperiment ->', err)
            }).finally(() => {
                this.setState({ stoppingExperiment: false })
            })
        })
    }

    /**
     * Handle changes in the checkedIgnoreProposedAlias value.
     * @param checkedIgnoreProposedAlias New checkedIgnoreProposedAlias value.
     */
    handleChangeIgnoreProposedAlias = (checkedIgnoreProposedAlias: boolean) => {
        // Clear all the proposed molecules as they are not valid anymore (they are computed on search only)
        this.setState(prevState => ({
            checkedIgnoreProposedAlias,
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesSymbolsFinder: {
                    ...prevState.formBiomarker.moleculesSymbolsFinder,
                    data: []
                }
            }
        }))
    }

    /**
     * Generates default settings for advance Algorithm data.
     * @returns Default structure of all advance algorithms.
     */
    getDefaultAdvancedAlgorithmParameters = (): AdvancedAlgorithmParameters => ({
        isActive: false,
        BBHA: {
            useSpark: true,
            numberOfStars: 60,
            numberOfIterations: 10,
            BBHAVersion: BBHAVersion.ORIGINAL,
            coeff1: 2.2,
            coeff2: 0.1
        },
        GA: {
            useSpark: true,
            numberOfIterations: 10,
            populationSize: 50,
            mutationRate: 0.01
        },
        coxRegression: {
            useSpark: true,
            topN: 5
        }
    })

    /**
     * Generates default settings for all the fitness functions.
     * @returns Default structure for all the fitness functions.
     */
    getDefaultFitnessFunctionParameters = (): FitnessFunctionParameters => ({
        clusteringParameters: { ...getDefaultClusteringParameters(), lookForOptimalNClusters: false }, // TODO: Change to default when implemented in backend
        svmParameters: getDefaultSvmParameters(),
        rfParameters: getDefaultRFParameters()
    })

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

    /**
     * Generates a default confirm modal structure
     * @returns Default confirmModal object
     */
    getDefaultConfirmModal = (): ConfirmModal => {
        return {
            confirmModal: false,
            headerText: '',
            contentText: '',
            onConfirm: () => console.log('DefaultConfirmModalFunction, this should change during cycle of component')
        }
    }

    handleCloseStopFSExperiment = () => {
        this.setState({ biomarkerToStop: null })
    }

    /**
     * Generates the modal to confirm an Experiment stopping
     * @returns Modal component. Null if no Experiment was selected to stop
     */
    getExperimentStopConfirmModals () {
        const biomarkerToStop = this.state.biomarkerToStop

        if (!biomarkerToStop) {
            return null
        }

        return (
            <Modal size='small' open={biomarkerToStop !== null} onClose={this.handleCloseStopFSExperiment} centered={false}>
                <Header icon='stop' content='Stop experiment' />
                <Modal.Content>
                    Are you sure you want to stop the experiment <strong>{biomarkerToStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleCloseStopFSExperiment}>
                        Cancel
                    </Button>
                    <Button
                        color='red'
                        onClick={() => this.stopFSExperiment()}
                        loading={this.state.stoppingExperiment}
                        disabled={this.state.stoppingExperiment}
                    >
                        Stop
                    </Button>
                </Modal.Actions>
            </Modal>
        )
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
     * Reset the confirm modal, to be used again
     */
    handleCancelConfirmModalState () {
        this.setState({ confirmModal: this.getDefaultConfirmModal() })
    }

    /**
     * Toggle if advance is active or not
     */
    handleSwitchAdvanceAlgorithm = () => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                advancedAlgorithmParameters: {
                    ...prevState.featureSelection.advancedAlgorithmParameters,
                    isActive: !prevState.featureSelection.advancedAlgorithmParameters.isActive
                }
            }
        }))
    }

    /**
     * Change the value of the advance algorithm and prop selected
     * @param advanceAlgorithm Advance algorithm selected
     * @param name name of prop to change
     * @param value value to set
     */
    handleChangeAdvanceAlgorithm = (advanceAlgorithm: string, name: string, value: any) => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                advancedAlgorithmParameters: {
                    ...prevState.featureSelection.advancedAlgorithmParameters,
                    [advanceAlgorithm]: {
                        ...prevState.featureSelection.advancedAlgorithmParameters[advanceAlgorithm],
                        [name]: value
                    }
                }
            }
        }))
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    selectNewFile = () => { this.updateSourceFilenamesAndCommonSamples() }

    /**
     * Select the algorithm, initialize the state of the selected and clean the others states
     * @param algorithm algorithm selected
     */
    handleChangeAlgorithm = (algorithm: FeatureSelectionAlgorithm) => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                algorithm
            }
        }))
    }

    /**
     * Select the algorithm, initialize the state of the selected and clean the others states
     * @param fitnessFunction Fitness function selected
     */
    handleChangeFitnessFunction = (fitnessFunction: FitnessFunction) => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                fitnessFunction
            }
        }))
    }

    /**
     * Manage changes of Feature Selection process parameters.
     * @param fitnessFunction name of fitness function to change
     * @param key name of the fitnessFunction object that have changed
     * @param value value selected typed depends of what fitness function and key is being changing
     */
    handleChangeFitnessFunctionOption = (fitnessFunction: string, key: string, value: any) => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                fitnessFunctionParameters: {
                    ...prevState.featureSelection.fitnessFunctionParameters,
                    [fitnessFunction]: {
                        ...prevState.featureSelection.fitnessFunctionParameters[fitnessFunction],
                        [key]: value
                    }
                }
            }
        }))
    }

    /**
     * Manage changes of CrossValidation parameters.
     * @param key name of the crossValidationParameters object that have changed.
     * @param value value selected.
     */
    handleChangeCrossValidation = (key: string, value: any) => {
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                crossValidationParameters: {
                    ...prevState.featureSelection.crossValidationParameters,
                    [key]: value
                }
            }
        }))
    }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                [sourceStateName]: {
                    ...prevState.featureSelection[sourceStateName],
                    type: SourceType.CGDS,
                    CGDSStudy: selectedStudy
                }
            }
        }), this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                [sourceStateName]: {
                    ...prevState.featureSelection[sourceStateName],
                    type: SourceType.UPLOADED_DATASETS,
                    selectedExistingFile: selectedFile,
                }
            }
        })
        , this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    handleChangeSourceType = (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => {
        // After update state
        this.setState(prevState => {
            // Selects source to update
            cleanRef(prevState.featureSelection[sourceStateName].newUploadedFileRef)
            return {
                featureSelection: {
                    ...prevState.featureSelection,
                    [sourceStateName]: {
                        ...prevState.featureSelection[sourceStateName],
                        type: sourceType,
                        selectedExistingFile: null,
                        CGDSStudy: null
                    }
                }
            }
        }
        , this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Updates Sources' filenames and common examples counter
     */
    updateSourceFilenamesAndCommonSamples = () => {
        this.updateSourceFilenames()
        // this.checkCommonSamples() TODO: check function and dependencies functions in file Pipeline.tsx
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    updateSourceFilenames = () => {
        // Updates state filenames
        this.setState(prevState => ({
            featureSelection: {
                ...prevState.featureSelection,
                mRNASource: {
                    ...prevState.featureSelection.mRNASource,
                    filename: getFilenameFromSource(prevState.featureSelection.mRNASource)
                },
                clinicalSource: {
                    ...prevState.featureSelection.clinicalSource,
                    filename: getFilenameFromSource(prevState.featureSelection.clinicalSource)
                },
                cnaSource: {
                    ...prevState.featureSelection.cnaSource,
                    filename: getFilenameFromSource(prevState.featureSelection.cnaSource)
                },
                mirnaSource: {
                    ...prevState.featureSelection.mirnaSource,
                    filename: getFilenameFromSource(prevState.featureSelection.mirnaSource)
                },
                methylationSource: {
                    ...prevState.featureSelection.methylationSource,
                    filename: getFilenameFromSource(prevState.featureSelection.methylationSource)
                }
            }
        }))
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => {
        this.setState(prevState => ({
            confirmModal: {
                ...prevState.confirmModal,
                confirmModal: setOption,
                headerText,
                contentText,
                onConfirm
            }
        }))
    }

    /**
     * Disambiguate the selected molecule for the yellow buttons.
     * @param moleculeToDisambiguate Molecule to disambiguate.
     * @param section Molecule section.
     * @param selectedOption Selected option.
     */
    handleSelectOptionMolecule = (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => {
        this.setState(prevState => {
            const indexToSelect = prevState.formBiomarker.moleculesSection[section].data.findIndex((item) => isEqual(item.value, moleculeToDisambiguate.value))

            // Checks if the molecule is already a valid one
            const exists = prevState.formBiomarker.moleculesSection[section].data.some((item) => item.value === selectedOption)
            const data: MoleculesSectionData[] = prevState.formBiomarker.moleculesSection[section].data
            data.splice(indexToSelect, 1)

            if (!exists) {
                data.push({
                    isValid: true,
                    value: selectedOption
                })
            }

            return {
                formBiomarker: {
                    ...prevState.formBiomarker,
                    moleculesSection: {
                        ...prevState.formBiomarker.moleculesSection,
                        [section]: {
                            ...prevState.formBiomarker.moleculesSection[section],
                            data
                        }
                    }
                }
            }
        })
    }

    /**
     * Method that select how the user is going to create a Biomarker
     * @param type Select the way to create a Biomarker
     */
    handleSelectModal = (type: BiomarkerOrigin) => {
        this.setState({ biomarkerTypeSelected: type })
    }

    getBiomarkerFullInstance = (biomarkerSimple: BiomarkerSimple): Promise<Biomarker> => {
        return new Promise((resolve, reject) => {
            this.setState({ loadingFullBiomarkerId: biomarkerSimple.id })
            ky.get(urlBiomarkersCRUD + '/' + biomarkerSimple.id + '/', { signal: this.abortController.signal }).then((response) => {
                response.json<Biomarker>().then((jsonResponse) => {
                    resolve(jsonResponse)
                }).catch((err) => {
                    console.error('Error parsing JSON on Biomarker retrieval:', err)
                    reject(err)
                })
            }).catch((err) => {
                console.error('Error getting Biomarker:', err)

                if (!this.abortController.signal.aborted) {
                    reject(err)
                }
            }).finally(() => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ loadingFullBiomarkerId: null })
                }
            })
        })
    }

    /**
     * Opens the modal to show all the Biomarker details.
     * @param selectedBiomarker Selected Biomarker instance.
     */
    openBiomarkerDetailsModal = (selectedBiomarker: BiomarkerSimple) => {
        this.getBiomarkerFullInstance(selectedBiomarker).then((biomarker) => {
            this.setState({
                selectedBiomarker: {
                    ...selectedBiomarker,
                    cnas: biomarker.cnas,
                    mirnas: biomarker.mirnas,
                    methylations: biomarker.methylations,
                    mrnas: biomarker.mrnas
                },
                openDetailsModal: true
            })
        })
    }

    /** Closes the modal of Biomarker's details. */
    closeBiomarkerDetailsModal = () => {
        this.setState({
            selectedBiomarker: null,
            openDetailsModal: false
        })
    }

    /**
     * Checks if the user can edit the Biomarker (i.e. It was not used for an Inference experiment, Statistical Validation or Trained Model).
     * @param biomarker Biomarker to check.
     * @returns True if the Biomarker can be edited, false otherwise.
     */
    canEditBiomarker = (biomarker: BiomarkerSimple): boolean => !biomarker.was_already_used && biomarker.state === BiomarkerState.COMPLETED

    /**
     * Method that select how the user is going to create a Biomarker
     * @param selectedBiomarker Biomarker selected to update
     */
    handleOpenEditBiomarker = (selectedBiomarker: BiomarkerSimple) => {
        this.getBiomarkerFullInstance(selectedBiomarker).then((biomarker) => {
            this.setState({
                biomarkerTypeSelected: BiomarkerOrigin.MANUAL,
                openCreateEditBiomarkerModal: true,
                formBiomarker: {
                    id: biomarker.id,
                    canEditMolecules: this.canEditBiomarker(biomarker),
                    biomarkerName: biomarker.name,
                    biomarkerDescription: biomarker.description,
                    tag: biomarker.tag,
                    moleculeSelected: BiomarkerType.MRNA,
                    moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT,
                    moleculesSection: {
                        [BiomarkerType.CNA]: {
                            isLoading: false,
                            data: biomarker.cnas.map(item => ({ isValid: true, value: item.identifier }))
                        },
                        [BiomarkerType.MIRNA]: {
                            isLoading: false,
                            data: biomarker.mirnas.map(item => ({ isValid: true, value: item.identifier }))
                        },
                        [BiomarkerType.METHYLATION]: {
                            isLoading: false,
                            data: biomarker.methylations.map(item => ({ isValid: true, value: item.identifier }))
                        },
                        [BiomarkerType.MRNA]: {
                            isLoading: false,
                            data: biomarker.mrnas.map(item => ({ isValid: true, value: item.identifier }))
                        }
                    },
                    validation: {
                        haveAmbiguous: false,
                        haveInvalid: false,
                        isLoading: false,
                        checkBox: false
                    },
                    moleculesSymbolsFinder: {
                        isLoading: false,
                        data: []
                    }
                }
            })
        })
    }

    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param query string that is sending to the api
     */
    handleGenesSymbolsFinder = (query: string): void => {
        let urlToFind = urlGeneSymbolsFinder

        //  True for loading

        this.setState(prevState => {
            switch (prevState.formBiomarker.moleculeSelected) {
                case BiomarkerType.MIRNA:
                    urlToFind = urlMiRNACodesFinder
                    break
                case BiomarkerType.METHYLATION:
                    urlToFind = urlMethylationSitesFinder
                    break
                default:
                    break
            }

            return {
                formBiomarker: {
                    ...prevState.formBiomarker,
                    moleculesSymbolsFinder: {
                        ...prevState.formBiomarker.moleculesSymbolsFinder,
                        isLoading: true
                    }
                }
            }
        })
        ky.get(urlToFind, { searchParams: { query, limit: 5 }, signal: this.abortController.signal, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json<MoleculeFinderResult[]>().then((jsonResponse) => {
                this.setState(prevState => {
                    const checkedIgnoreProposedAlias = prevState.checkedIgnoreProposedAlias // For short
                    return {
                        formBiomarker: {
                            ...prevState.formBiomarker,
                            moleculesSymbolsFinder: {
                                ...prevState.formBiomarker.moleculesSymbolsFinder,
                                data: jsonResponse.map(molecule => {
                                    const text = checkedIgnoreProposedAlias || molecule.molecule === molecule.standard
                                        ? molecule.molecule
                                        : `${molecule.molecule} (${molecule.standard})`

                                    return {
                                        key: molecule.molecule,
                                        text,
                                        value: checkedIgnoreProposedAlias ? molecule.molecule : molecule.standard
                                    }
                                }),
                                isLoading: false
                            }
                        }
                    }
                })
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting genes ->', err)
        }).finally(() => {
            if (!this.abortController.signal.aborted) {
                this.setState(prevState => ({
                    formBiomarker: {
                        ...prevState.formBiomarker,
                        moleculesSymbolsFinder: {
                            ...prevState.formBiomarker.moleculesSymbolsFinder,
                            isLoading: false
                        }
                    }
                }))
            }
        })
    }

    /**
     * Method that removes invalid genes of the sector selected
     * @param sector string of the sector selected to change state
     */
    handleRemoveInvalidGenes = (sector: BiomarkerType): void => {
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesSection: {
                    ...prevState.formBiomarker.moleculesSection,
                    [sector]: {
                        ...prevState.formBiomarker.moleculesSection[sector],
                        data: prevState.formBiomarker.moleculesSection[sector].data.filter(gen => gen.isValid || Array.isArray(gen.value))
                    }
                }
            }
        }))
    }

    /**
     * Method that removes all the molecules of the sector selecterd
     * @param sector string of the sector selected to change state
     */
    handleRestartSection = (sector: BiomarkerType): void => {
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesSection: {
                    ...prevState.formBiomarker.moleculesSection,
                    [sector]: {
                        ...prevState.formBiomarker.moleculesSection[sector],
                        data: []
                    }
                }
            }
        }))
    }

    /**
     * Order data to show in the section.
     * @param data Data to order.
     * @returns Ordered data.
     */
    orderData = (data: MoleculesSectionData[]): MoleculesSectionData[] => {
        return data.sort((a, b) => {
            const cond = Number(a.isValid) - Number(b.isValid)

            if (cond !== 0) {
                return cond
            }

            return Array.isArray(a.value) ? 1 : -1
        })
    }

    /**
     * Sets a list of molecules to the current selected section.
     * @param moleculesList List of molecules to set.
     */
    setMoleculesToSelectedSection = (moleculesList: MoleculesSectionData[]) => {
        const moleculeTypeSelected = this.state.formBiomarker.moleculeSelected

        // Sets loading in false
        const moleculesSection = {
            ...this.state.formBiomarker.moleculesSection,
            [moleculeTypeSelected]: {
                isLoading: false,
                data: this.orderData([...this.state.formBiomarker.moleculesSection[moleculeTypeSelected].data].concat(moleculesList))
            }
        }

        const newFormBiomarker: FormBiomarkerData = {
            ...this.state.formBiomarker,
            moleculesSection
        }

        newFormBiomarker.moleculesSymbolsFinder.isLoading = false
        newFormBiomarker.moleculesSection[moleculeTypeSelected].isLoading = false

        this.setState({ formBiomarker: newFormBiomarker })
    }

    /**
     * Method that gets symbols while user is writing in Select molecules input
     * @param molecules array of strings that is sending to the api
     */
    handleGeneSymbols = async (molecules: string[]): Promise<void> => {
        this.setState(prevState => {
            const moleculesSectionPreload = {
                ...prevState.formBiomarker.moleculesSection,
                [prevState.formBiomarker.moleculeSelected]: {
                    isLoading: true,
                    data: [...prevState.formBiomarker.moleculesSection[prevState.formBiomarker.moleculeSelected].data]
                }
            }
            return {
                formBiomarker: {
                    ...prevState.formBiomarker,
                    moleculesSymbolsFinder: {
                        ...prevState.formBiomarker.moleculesSymbolsFinder,
                        isLoading: true
                    },
                    moleculesSection: moleculesSectionPreload
                }
            }
        })
        let urlToFind: string
        let json: { [key: string]: string[] }
        let keyMolecules: string

        switch (this.state.formBiomarker.moleculeSelected) {
            case BiomarkerType.MIRNA:
                urlToFind = urlMiRNACodes
                json = { mirna_codes: molecules }
                keyMolecules = 'mirna_codes'
                break
            case BiomarkerType.METHYLATION:
                urlToFind = urlMethylationSites
                json = { methylation_sites: molecules }
                keyMolecules = 'methylation_sites'
                break
            default:
                urlToFind = urlGeneSymbols
                json = { gene_ids: molecules }
                keyMolecules = 'gene_ids'
                break
        }

        const genesArray: MoleculesSectionData[] = []
        ky.post(urlToFind, { headers: getDjangoHeader(), json, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json<{ [key: string]: string[] }>().then((jsonResponse) => {
                const genes = Object.entries(jsonResponse)

                for (const gene of genes) {
                    let condition

                    switch (gene[1].length) {
                        case 0:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(item => item.value === gene[0])

                            if (!condition.length) {
                                genesArray.push({
                                    isValid: false,
                                    value: gene[0]
                                })
                            }

                            break
                        case 1:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(item => item.value === gene[1][0])

                            if (!condition.length) {
                                genesArray.push({
                                    isValid: true,
                                    value: gene[1][0]
                                })
                            }

                            break
                        default:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(
                                item => isEqual(item.value, gene[1])
                            )

                            if (!condition.length) {
                                genesArray.push({
                                    isValid: false,
                                    value: gene[1]
                                })
                            }

                            break
                    }
                }
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
                console.warn('Setting all molecules as invalid to show warning')

                json[keyMolecules].forEach(molecule => {
                    genesArray.push({
                        isValid: false,
                        value: molecule
                    })
                })
            }).finally(() => {
                this.setMoleculesToSelectedSection(genesArray)
            })
        }).catch((err) => {
            console.error('Error getting molecules ->', err)
            console.warn('Setting all molecules as invalid to show warning')

            json[keyMolecules].forEach(molecule => {
                genesArray.push({
                    isValid: false,
                    value: molecule
                })
            })
        }).finally(() => {
            this.setMoleculesToSelectedSection(genesArray)
        })
    }

    /**
     * Generates a default formBiomarker
     * @returns Default FormBiomarkerData object
     */
    getDefaultFormBiomarker (): FormBiomarkerData {
        return {
            id: null,
            biomarkerName: '',
            biomarkerDescription: '',
            canEditMolecules: true,
            tag: null,
            moleculeSelected: BiomarkerType.MRNA,
            moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT,
            validation: {
                haveAmbiguous: false,
                haveInvalid: false,
                isLoading: false,
                checkBox: false
            },
            moleculesSection: {
                [BiomarkerType.CNA]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.MIRNA]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.METHYLATION]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.MRNA]: {
                    isLoading: false,
                    data: []
                }
            },
            moleculesSymbolsFinder: {
                isLoading: false,
                data: []
            }
        }
    }

    /**
     * Updates checkbox status
     * @param value new value to set
     */
    handleChangeCheckBox = (value: boolean) => {
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                validation: {
                    ...prevState.formBiomarker.validation,
                    checkBox: value
                }
            }
        }))
    }

    /**
     * Validates if the form is correct, if not change state of labels alerts bars
     * @returns Some flags indicating if the form is valid or not
     */
    handleValidateForm = (): ValidationForm => {
        let haveAmbiguous = false
        let haveInvalid = false

        for (const option of Object.values(BiomarkerType)) {
            if (!haveAmbiguous) {
                const indexOfAmbiguous = this.state.formBiomarker.moleculesSection[option].data.findIndex(item => !item.isValid && Array.isArray(item.value))

                if (indexOfAmbiguous >= 0) {
                    haveAmbiguous = true
                }
            }

            if (!haveInvalid && !this.state.formBiomarker.validation.checkBox) {
                const indexOfInvalid = this.state.formBiomarker.moleculesSection[option].data.findIndex(item => !item.isValid && !Array.isArray(item.value))

                if (indexOfInvalid >= 0) {
                    haveInvalid = true
                }
            }
        }

        return {
            haveAmbiguous,
            haveInvalid
        }
    }

    /**
     * Checks if it's a valid structure to send the molecule to backend and create the Biomarker.
     * @param item Molecule to send.
     * @returns True if it's valid, false if not.
     */
    moleculeIdentifierIsValid = (item: MoleculesSectionData): boolean => !Array.isArray(item.value) && item.isValid

    /**
     * Generates a valid structure to send the molecule to backend and create the Biomarker
     * @param item Molecule to send
     * @returns Correct structure to send
     */
    moleculeIdentified = (item: MoleculesSectionData): SaveMoleculeStructure => ({
        identifier: item.value as string
    })

    /**
     * Generates a valid structure to send the molecules to backend and create the Biomarker checking if the
     * "Ignore errors" checkbox is checked or not.
     * @param molecules Molecules to send.
     * @returns Correct structure to send.
     */
    getMoleculesData = (molecules: MoleculesSectionData[]): SaveMoleculeStructure[] => {
        const ignoreErrors = this.state.formBiomarker.validation.checkBox

        if (ignoreErrors) {
            return molecules.map(this.moleculeIdentified)
        } else {
            return molecules.filter(this.moleculeIdentifierIsValid).map(this.moleculeIdentified)
        }
    }

    /**
     * Makes the request to create a Biomarker
     */
    handleSendForm = () => {
        const formBiomarker = this.state.formBiomarker
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                validation: {
                    ...prevState.formBiomarker.validation,
                    isLoading: true
                }
            }
        }))

        // Gets name and description
        const simpleBiomarker: BiomarkerNameAndDesc = {
            name: formBiomarker.biomarkerName,
            description: formBiomarker.biomarkerDescription,
            ...(formBiomarker.tag && { tag: formBiomarker.tag })
        }

        // Adds molecules if needed
        const biomarkerToSend: SaveBiomarkerStructure | BiomarkerNameAndDesc = formBiomarker.canEditMolecules
            ? {
                ...simpleBiomarker,
                mrnas: this.getMoleculesData(formBiomarker.moleculesSection.mRNA.data),
                mirnas: this.getMoleculesData(formBiomarker.moleculesSection.miRNA.data),
                cnas: this.getMoleculesData(formBiomarker.moleculesSection.CNA.data),
                methylations: this.getMoleculesData(formBiomarker.moleculesSection.Methylation.data)
            }
            : simpleBiomarker

        const settings: Options = {
            headers: getDjangoHeader(),
            json: biomarkerToSend,
            timeout: REQUEST_TIMEOUT
        }

        // Checks if it's a creation or an update
        if (!formBiomarker.id) {
            ky.post(urlBiomarkersCreate, settings).then((response) => {
                response.json<Biomarker>().then((_jsonResponse) => {
                    this.closeModalWithSuccessMsg('Biomarker created successfully')
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.error('Error adding Biomarker ->', err)
                this.setState(prevState => ({
                    alert: {
                        ...prevState.alert,
                        isOpen: true,
                        type: CustomAlertTypes.ERROR,
                        message: 'Error creating biomarker!'
                    }
                }))
            }).finally(() => {
                this.setState(prevState => ({
                    formBiomarker: {
                        ...prevState.formBiomarker,
                        validation: {
                            ...prevState.formBiomarker.validation,
                            isLoading: false
                        }
                    }
                }))
            })
        } else {
            const url = formBiomarker.canEditMolecules ? urlBiomarkersCRUD : urlBiomarkersSimpleUpdate
            ky.patch(`${url}/${formBiomarker.id}/`, settings).then((response) => {
                response.json<Biomarker>().then((_jsonResponse) => {
                    this.closeModalWithSuccessMsg('Biomarker edited successfully')
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.error('Error getting genes ->', err)
                this.setState(prevState => ({
                    alert: {
                        ...prevState.alert,
                        isOpen: true,
                        type: CustomAlertTypes.ERROR,
                        message: 'Error editing biomarker!'
                    }
                }))
            }).finally(() => {
                this.setState(prevState => ({
                    formBiomarker: {
                        ...prevState.formBiomarker,
                        validation: {
                            ...prevState.formBiomarker.validation,
                            isLoading: false
                        }
                    }
                }))
            })
        }
    }

    /**
     * change name or description of manual form
     * @param value new value for input form
     * @param name type of input to change
     */
    handleChangeInputForm = (value: string, name: 'biomarkerName' | 'biomarkerDescription' | 'tag') => {
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                [name]: value
            }
        }))
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to set to the state moleculeSelected in formBiomarkerState
     */
    handleChangeMoleculeSelected = (value: BiomarkerType) => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker.moleculeSelected = value
        formBiomarker.moleculesSymbolsFinder.data = []
        this.setState({
            formBiomarker
        })
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculeSelected: value,
                moleculesSymbolsFinder: {
                    ...prevState.formBiomarker.moleculesSymbolsFinder,
                    data: []
                }
            }
        }))
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to set to the state moleculesTypeOfSelection in formBiomarkerState
     */
    handleChangeMoleculeInputSelected = (value: MoleculesTypeOfSelection) => {
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesTypeOfSelection: value
            }
        }))
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to add to the molecules section that is selected
     */
    handleAddMoleculeToSection = (value: MoleculesSectionData) => {
        const genesSymbolsFinder = this.state.formBiomarker.moleculesSymbolsFinder
        genesSymbolsFinder.data = []
        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesSymbolsFinder: genesSymbolsFinder
            }
        }))

        const sectionFound = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.find((item: MoleculesSectionData) => value.value === item.value)

        if (sectionFound !== undefined) {
            return
        }

        this.setState(prevState => {
            const moleculesSection = {
                ...prevState.formBiomarker.moleculesSection,
                [prevState.formBiomarker.moleculeSelected]: {
                    isLoading: false,
                    data: [...prevState.formBiomarker.moleculesSection[prevState.formBiomarker.moleculeSelected].data, value]
                }
            }
            return {
                formBiomarker: {
                    ...prevState.formBiomarker,
                    moleculesSection
                }
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param section Value to add to the molecules section that is selected
     * @param molecule molecule to remove of the array
     */
    handleRemoveMolecule = (section: BiomarkerType, molecule: MoleculesSectionData) => {
        // keeps the molecules that are not the one that is going to be removed
        const data = this.state.formBiomarker.moleculesSection[section].data.filter((item: MoleculesSectionData) => {
            return item.value !== molecule.value
        })

        this.setState(prevState => ({
            formBiomarker: {
                ...prevState.formBiomarker,
                moleculesSection: {
                    ...prevState.formBiomarker.moleculesSection,
                    [section]: {
                        isLoading: false,
                        data
                    }
                }
            }
        }))
    }

    /**
     * Handles input changes in the New File Form
     * @param name State field to change
     * @param value Value to assign to the specified field
     */
    handleAddFileInputsChange = (name: string, value: any) => {
        const newFileForm = this.state.newFile
        newFileForm[name] = value
        this.setState({ newFile: newFileForm })
    }

    /**
     * Cleans the new/edit biomarker form
     */
    cleanForm = () => {
        this.setState({
            openCreateEditBiomarkerModal: true,
            formBiomarker: this.getDefaultFormBiomarker(),
            confirmModal: this.getDefaultConfirmModal()
        })
    }

    /** Makes a request to delete a Biomarker. */
    deleteBiomarker = () => {
        // Sets the Request's Headers
        if (this.state.selectedBiomarkerToDeleteOrSync === null) {
            return
        }

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkersCRUD}/${this.state.selectedBiomarkerToDeleteOrSync.id}/`
        this.setState({ deletingBiomarker: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingBiomarker: false,
                        showDeleteBiomarkerModal: false
                    })
                }
            }).catch((err) => {
                this.setState({ deletingBiomarker: false })
                alertGeneralError()
                console.log('Error deleting Biomarker ->', err)
            })
        })
    }

    /**
     * Show a modal to confirm a Biomarker deletion
     * @param biomarker Selected Biomarker to delete
     */
    confirmBiomarkerDeletion = (biomarker: BiomarkerSimple) => {
        this.setState<never>({
            selectedBiomarkerToDeleteOrSync: biomarker,
            showDeleteBiomarkerModal: true
        })
    }

    /** Closes the deletion confirm modals. */
    handleClose = () => {
        this.setState({ showDeleteBiomarkerModal: false })
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (idxSurvivalTuple: number) => {
        this.setState(prevState => ({
            newFile: {
                ...prevState.newFile,
                survivalColumns: prevState.newFile.survivalColumns.filter((_, i) => i !== idxSurvivalTuple),
            },
        }))
    }

    /**
     * Generates the modal to confirm a biomarker deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getDeletionConfirmModal () {
        if (!this.state.selectedBiomarkerToDeleteOrSync) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteBiomarkerModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete Biomarker' />
                <Modal.Content>
                    Are you sure you want to delete the Biomarker <strong>{this.state.selectedBiomarkerToDeleteOrSync.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteBiomarker} loading={this.state.deletingBiomarker} disabled={this.state.deletingBiomarker}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Checks if the form is entirely empty. Useful to enable 'Cancel' button
     * @returns True is any of the form's field contains any data. False otherwise
     */
    isFormEmpty = (): boolean => isEqual(this.state.formBiomarker, this.getDefaultFormBiomarker())

    /**
     * Callback to mark a Biomarker as selected
     * @param biomarker Selected biomarker to mark
     */
    markBiomarkerAsSelected = (biomarker: Biomarker) => {
        const featureSelection = this.state.featureSelection
        featureSelection.selectedBiomarker = biomarker
        this.setState({ featureSelection })
    }

    /**
     * Function to complete step 1 (selects a Biomarker instance)
     * @param selectedBiomarker Biomarker selected to continue process
     */
    handleCompleteStep1 = (selectedBiomarker: Biomarker) => {
        const featureSelection = this.state.featureSelection
        featureSelection.biomarker = selectedBiomarker
        featureSelection.step = 2

        const numberOfMolecules = getNumberOfMoleculesOfBiomarker(selectedBiomarker)

        // In case of few molecules, the user cannot run metaheuristics
        if (numberOfMolecules < minFeaturesMetaheuristics) {
            featureSelection.algorithm = FeatureSelectionAlgorithm.BLIND_SEARCH
        } else {
            // In case of a high number of features, prevents the user from using Blind Search.
            if (numberOfMolecules > maxFeaturesBlindSearch) {
                featureSelection.algorithm = FeatureSelectionAlgorithm.BBHA
            }
        }

        this.setState({ featureSelection })
    }

    /**
     * Function to complete step 2
     */
    handleCompleteStep2 = () => {
        const featureSelection = this.state.featureSelection
        featureSelection.step = 3
        this.setState({ featureSelection })
    }

    /**
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (idxSurvivalTuple: number, name: string, value: any) => {
        this.setState(prevState => ({
            newFile: {
                ...prevState.newFile,
                survivalColumns: prevState.newFile.survivalColumns.map((t, i) =>
                    i === idxSurvivalTuple ? { ...t, [name]: value } : t
                ),
            },
        }))
    }

    /**
     * Function to go back to step 1
     */
    handleGoBackStep1 = () => {
        const featureSelection = this.state.featureSelection
        featureSelection.clinicalSource = getDefaultSource()
        featureSelection.mRNASource = getDefaultSource()
        featureSelection.mirnaSource = getDefaultSource()
        featureSelection.methylationSource = getDefaultSource()
        featureSelection.cnaSource = getDefaultSource()
        featureSelection.step = 1
        this.setState({ featureSelection })
    }

    /** Closes the modal to confirm a Biomarker cloning. */
    closeModalToClone = () => { this.setState({ biomarkerToClone: null }) }

    /** Sends a request to clone a Biomarker. */
    cloneBiomarker = () => {
        if (!this.state.biomarkerToClone || this.state.cloningBiomarker) {
            return
        }

        this.setState({ cloningBiomarker: true })

        const url = `${urlCloneBiomarker}/${this.state.biomarkerToClone.id}/`
        ky.get(url, { searchParams: { limit: 5 }, signal: this.abortController.signal, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json<OkResponse>().then((responseJSON) => {
                if (responseJSON.ok) {
                    this.closeModalToClone()
                } else {
                    alertGeneralError()
                }
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error cloning Biomarker ->', err)

            if (!this.abortController.signal.aborted) {
                alertGeneralError()
            }
        }).finally(() => {
            if (!this.abortController.signal.aborted) {
                this.setState({ cloningBiomarker: false })
            }
        })
    }

    /**
     * Function to go back to step 2
     */
    handleGoBackStep2 = () => {
        const featureSelection = this.state.featureSelection
        featureSelection.step = 2
        featureSelection.algorithm = FeatureSelectionAlgorithm.BLIND_SEARCH
        this.setState({ featureSelection })
    }

    /**
     * Closes the modal and shows a successful Semantic-UI Alert message.
     * @param msg Message to show.
     */
    closeModalWithSuccessMsg = (msg: string) => {
        const alert = this.state.alert
        alert.isOpen = true
        alert.type = CustomAlertTypes.SUCCESS
        alert.message = msg
        this.setState({
            alert,
            formBiomarker: this.getDefaultFormBiomarker(),
            openCreateEditBiomarkerModal: false,
            confirmModal: this.getDefaultConfirmModal(),
            biomarkerTypeSelected: BiomarkerOrigin.BASE
        })
    }

    /**
     * Submits the Feature Selection experiment to backend
     */
    submitFeatureSelectionExperiment = () => {
        // For short...
        const fsSettings = this.state.featureSelection

        if (!fsSettings.biomarker || this.state.submittingFSExperiment) {
            return
        }

        this.setState({ submittingFSExperiment: true }, () => {
            // Generates the FormData
            const formData = new FormData()

            // Appends Biomarker's pk and FS settings
            formData.append('biomarkerPk', (fsSettings.biomarker?.id as number).toString())
            formData.append('algorithm', fsSettings.algorithm.toString())
            formData.append('algorithmParameters', JSON.stringify(fsSettings.advancedAlgorithmParameters))
            formData.append('crossValidationParameters', JSON.stringify(fsSettings.crossValidationParameters))
            formData.append('fitnessFunction', fsSettings.fitnessFunction.toString())
            formData.append('fitnessFunctionParameters', JSON.stringify(fsSettings.fitnessFunctionParameters))

            // Appends the source type, and the file content depending of it (pk if selecting
            // an existing file, Blob content if uploading a new file, etc)
            makeSourceAndAppend(fsSettings.mRNASource, formData, 'mRNA')
            makeSourceAndAppend(fsSettings.mirnaSource, formData, 'miRNA')
            makeSourceAndAppend(fsSettings.cnaSource, formData, 'cna')
            makeSourceAndAppend(fsSettings.methylationSource, formData, 'methylation')
            makeSourceAndAppend(fsSettings.clinicalSource, formData, 'clinical')

            // Sets the Request's Headers
            const headers = getDjangoHeader()

            ky.post(urlFeatureSelectionSubmit, { headers, body: formData }).then((response) => {
                response.json<OkResponse>().then((responseJSON) => {
                    if (responseJSON.ok) {
                        this.closeModalWithSuccessMsg('Experiment submitted!')
                        this.setState({ featureSelection: this.getDefaultFeatureSelectionProps(), openCreateEditBiomarkerModal: false })
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
                this.setState({ submittingFSExperiment: false })
            })
        })
    }

    /**
     * Generates default table's Filters.
     * @returns Default object for table's Filters
     */
    getDefaultFilters (): PaginationCustomFilter[] {
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        // TODO: refactor Tag key as it's the same as AllExperimentsView.tsx and UserFilesView.tsx
        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', placeholder: 'Select an existing Tag', options: tagOptions, width: 3 }
        ]
    }

    /**
     * Fetches the User's defined tags
     */
    getUserTags () {
        // Gets only File's Tags
        const searchParams = {
            type: TagType.FILE
        }

        ky.get(urlTagsCRUD, { searchParams, signal: this.abortController.signal }).then((response) => {
            response.json<DjangoTag[]>().then((tags) => {
                this.setState({ tags })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
        })
    }

    closeBiomarkerModal = () => {
        this.setState({
            formBiomarker: this.getDefaultFormBiomarker(),
            featureSelection: this.getDefaultFeatureSelectionProps(),
            openCreateEditBiomarkerModal: false,
            confirmModal: this.getDefaultConfirmModal(),
            biomarkerTypeSelected: BiomarkerOrigin.BASE
        })
    }

    /**
     * Generates the modal to confirm a Tag deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getTagDeletionConfirmModals () {
        if (!this.state.selectedTagToDelete) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteTagModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete tag' />
                <Modal.Content>
                    <p>Are you sure you want to delete the Tag "{this.state.selectedTagToDelete.name}"?</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteTag} loading={this.state.deletingTag} disabled={this.state.deletingTag}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Handles New Tag Input changes
     * @param name State field to change
     * @param value Value to assign to the specified field
     */
    handleAddTagInputsChange = (name: string, value) => {
        const newTag = this.state.newTag
        newTag[name] = value
        this.setState(prevState => ({
            newTag: {
                ...prevState.newTag,
                [name]: value,
            }
        }))
    }

    /**
     * Makes a request to delete a Tag
     */
    deleteTag = () => {
        if (this.state.selectedTagToDelete === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlTagsCRUD}${this.state.selectedTagToDelete.id}`
        this.setState({ deletingTag: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingTag: false,
                        showDeleteTagModal: false
                    })
                    this.getUserTags()
                }
            }).catch((err) => {
                this.setState({ deletingTag: false })
                alertGeneralError()
                console.log('Error deleting Tag ->', err)
            })
        })
    }

    /**
     * Handles New Tag Input Key Press
     * @param e Event of change
     */
    handleKeyDown = (e) => {
        // If pressed Enter key submits the new Tag
        if (e.which === 13 || e.keyCode === 13) {
            this.addOrEditTag()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newTag: getDefaultNewTag() })
            }
        }
    }

    /**
     * Show a modal to confirm a Tag deletion
     * @param tag Selected Tag to delete
     */
    confirmTagDeletion = (tag: DjangoTag) => {
        this.setState({
            selectedTagToDelete: tag,
            showDeleteTagModal: true
        })
    }

    /**
     * Does a request to add a new Tag
     */
    addOrEditTag () {
        if (this.state.addingTag) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // If exists an id then we are editing, otherwise It's a new Tag
        let addOrEditURL, requestMethod

        if (this.state.newTag.id !== null) {
            addOrEditURL = `${urlTagsCRUD}${this.state.newTag.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlTagsCRUD
            requestMethod = ky.post
        }

        this.setState({ addingTag: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newTag }).then((response) => {
                this.setState({ addingTag: false })
                response.json().then((responseJSON: DjangoTag) => {
                    if (responseJSON && responseJSON.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.setState({ newTag: getDefaultNewTag() })
                        this.getUserTags()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ addingTag: false })
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            })
        })
    }

    /**
     * Selects a new Tag to edit
     * @param selectedTag Tag to edit
     */
    editTag = (selectedTag: DjangoTag) => { this.setState({ newTag: copyObject(selectedTag) }) }

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()
        const experimentStopConfirmModal = this.getExperimentStopConfirmModals()

        const isLoadingFullBiomarker = this.state.loadingFullBiomarkerId !== null

        // Tag and File deletion modals
        const tagDeletionConfirmModal = this.getTagDeletionConfirmModals()
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })
        return (
            <Base activeItem='biomarkers' wrapperClass='wrapper'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                {/* Experiment stopping confirm modal */}
                {experimentStopConfirmModal}

                {/* Tag deletion modal */}
                {tagDeletionConfirmModal}

                <Grid columns={2} padded stackable textAlign='center' divided>
                    <Grid.Column width={3} textAlign='left'>

                        <Grid.Column width={3} textAlign='left'>
                            <TagsPanel
                                tags={this.state.tags}
                                newTag={this.state.newTag}
                                addingTag={this.state.addingTag}
                                handleAddTagInputsChange={this.handleAddTagInputsChange}
                                handleKeyDown={this.handleKeyDown}
                                confirmTagDeletion={this.confirmTagDeletion}
                                editTag={this.editTag}
                            />
                        </Grid.Column>
                        <Confirm
                            open={this.state.confirmModal.confirmModal}
                            header={this.state.confirmModal.headerText}
                            content={this.state.confirmModal.contentText}
                            onCancel={() => this.handleCancelConfirmModalState()}
                            onConfirm={() => {
                                this.handleCancelConfirmModalState()
                                this.state.confirmModal.onConfirm()
                            }}
                        />
                    </Grid.Column>

                    {/* Files overview panel */}
                    <Grid.Column
                        id='files-manager-result-column'
                        width={13}
                        textAlign='center'
                    >
                        <PaginatedTable<BiomarkerSimple>
                            headerTitle='Biomarkers'
                            headers={[
                                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                                { name: 'Description', serverCodeToSort: 'description', width: 4 },
                                { name: 'Tag', serverCodeToSort: 'tag' },
                                { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                                { name: 'Origin', serverCodeToSort: 'origin', textAlign: 'center' },
                                { name: 'Date', serverCodeToSort: 'upload_date' },
                                { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
                                { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
                                { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
                                { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 },
                                { name: 'Public', width: 1 },
                                { name: 'Shared', width: 1 },
                                { name: 'Actions', width: 2 }
                            ]}
                            defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                            customFilters={this.getDefaultFilters()}
                            showSearchInput
                            customElements={[
                                <Form.Field key={1} className='custom-table-field' title='Add new Biomarker'>
                                    <Button
                                        primary
                                        icon
                                        onClick={() => this.setState({ formBiomarker: this.getDefaultFormBiomarker(), openCreateEditBiomarkerModal: true })}
                                    >
                                        <Icon name='add' />
                                    </Button>
                                </Form.Field>
                            ]}
                            searchLabel='Name'
                            searchPlaceholder='Search by name'
                            urlToRetrieveData={urlBiomarkersCRUD}
                            updateWSKey='update_biomarkers'
                            mapFunction={(biomarker: BiomarkerSimple) => {
                                const showNumberOfMolecules = biomarker.state === BiomarkerState.COMPLETED
                                const canEditMolecules = this.canEditBiomarker(biomarker)
                                const currentBiomarkerIsLoading = biomarker.id === this.state.loadingFullBiomarkerId
                                const isInProcess = biomarker.state === BiomarkerState.IN_PROCESS ||
                            biomarker.state === BiomarkerState.WAITING_FOR_QUEUE

                                return (
                                    <Table.Row key={biomarker.id as number}>
                                        <TableCellWithTitle value={biomarker.name} />
                                        <TableCellWithTitle value={biomarker.description} />
                                        <Table.Cell><TagLabel tag={biomarker.tag} /></Table.Cell>
                                        <Table.Cell textAlign='center'><BiomarkerStateLabel biomarkerState={biomarker.state} /></Table.Cell>
                                        <Table.Cell><BiomarkerOriginLabel biomarkerOrigin={biomarker.origin} /></Table.Cell>
                                        <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'L')} />
                                        <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_mrnas : '-'}</Table.Cell>
                                        <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_mirnas : '-'}</Table.Cell>
                                        <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_cnas : '-'}</Table.Cell>
                                        <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_methylations : '-'}</Table.Cell>
                                        <Table.Cell textAlign='center'>
                                            {
                                                biomarker.is_public
                                                    ? (
                                                        <Icon
                                                            title='All users of the platform can see this experiment'
                                                            name='check'
                                                            color='green'
                                                        />
                                                    )
                                                    : (
                                                        <Icon
                                                            title='If this is checked all the users in the platform can see (but not edit or remove) this element'
                                                            name='close'
                                                            color='red'
                                                        />
                                                    )
                                            }
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                basic
                                                icon
                                                className='borderless-button'
                                                onClick={() => this.setState({ modalInstitutions: { ...this.state.modalInstitutions, biomarkerId: biomarker.id || 0, isOpen: true, user: biomarker.user } })}
                                            >
                                                <Icon
                                                    title='shared institutions'
                                                    name='building'
                                                    color='green'
                                                />
                                            </Button>
                                            <Button
                                                basic
                                                icon
                                                className='borderless-button'
                                                onClick={() => this.setState({ modalUsers: { ...this.state.modalUsers, biomarkerId: biomarker.id || 0, isOpen: true, user: biomarker.user } })}
                                            >
                                                <Icon
                                                    title='shared users'
                                                    name='users'
                                                    color='teal'
                                                />
                                            </Button>
                                        </Table.Cell>
                                        <Table.Cell width={1}>
                                            {/* Users can modify or delete own biomarkers or the ones which the user is admin of */}
                                            <>
                                                {/* Details button */}
                                                <Icon
                                                    name={currentBiomarkerIsLoading ? 'spinner' : 'chart bar'}
                                                    className='clickable'
                                                    color='blue'
                                                    title='Details'
                                                    loading={currentBiomarkerIsLoading}
                                                    disabled={biomarker.state !== BiomarkerState.COMPLETED || isLoadingFullBiomarker}
                                                    onClick={() => this.openBiomarkerDetailsModal(biomarker)}
                                                />

                                                {/* Edit button */}
                                                <EditBiomarkerIcon
                                                    handleOpenEditBiomarker={this.handleOpenEditBiomarker}
                                                    biomarker={biomarker}
                                                    ownerId={biomarker.user.id}
                                                    currentBiomarkerIsLoading={currentBiomarkerIsLoading}
                                                    canEditMolecules={canEditMolecules}
                                                    isLoadingFullBiomarker={isLoadingFullBiomarker}
                                                />
                                                <PopupIcons
                                                    content={(
                                                        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                                            {/* Clone button */}
                                                            <Icon
                                                                name='copy'
                                                                color='teal'
                                                                className='clickable margin-left-5'
                                                                disabled={currentBiomarkerIsLoading}
                                                                title='Clone biomarker'
                                                                onClick={() => this.setState({ biomarkerToClone: biomarker })}
                                                            />

                                                            {/* Stop button */}
                                                            {isInProcess && (
                                                                <StopExperimentButton
                                                                    title='Stop biomarker'
                                                                    onClick={() => this.setState({ biomarkerToStop: biomarker })}
                                                                />
                                                            )}

                                                            {/* Delete button */}
                                                            {!isInProcess && !biomarker.is_public && (
                                                                <DeleteButton
                                                                    title='Delete biomarker'
                                                                    disabled={currentBiomarkerIsLoading}
                                                                    onClick={() => this.confirmBiomarkerDeletion(biomarker)}
                                                                    ownerId={biomarker.user.id}
                                                                />
                                                            )}
                                                            {/* Public switch */}
                                                            {
                                                                biomarker.id && (
                                                                    <SwitchPublicButton
                                                                        publicButtonEntity={{ id: biomarker.id ?? 0, user: { id: biomarker.user.id }, is_public: biomarker.is_public }}
                                                                        publicKey='biomarkerId'
                                                                        nameEntity='biomarker'
                                                                        handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                                                                    />
                                                                )
                                                            }
                                                        </div>
                                                    )}
                                                />
                                            </>
                                        </Table.Cell>
                                    </Table.Row>

                                )
                            }}
                        />

                        {/* Create/Edit modal. */}
                        <Modal
                            open={this.state.biomarkerToClone !== null}
                            centered={false}
                            onClose={this.closeModalToClone}
                        >
                            <Header icon='copy' content='Clone Biomarker' />
                            <Modal.Content>
                                Are you sure you want to clone the Biomarker "<strong>{this.state.biomarkerToClone?.name}</strong>"?
                            </Modal.Content>
                            <Modal.Actions>
                                <Button onClick={this.closeModalToClone}>
                                    Cancel
                                </Button>
                                <Button color='blue' onClick={this.cloneBiomarker} loading={this.state.cloningBiomarker} disabled={this.state.cloningBiomarker}>
                                    Clone
                                </Button>
                            </Modal.Actions>
                        </Modal>

                        {/* Create/Edit modal. */}
                        <Modal
                            open={this.state.openCreateEditBiomarkerModal}
                            closeIcon={<Icon name='close' size='large' />}
                            closeOnEscape={false}
                            closeOnDimmerClick={false}
                            closeOnDocumentClick={false}
                            className={this.state.biomarkerTypeSelected !== BiomarkerOrigin.BASE ? 'space-modal large-modal' : undefined}
                            style={this.state.biomarkerTypeSelected === BiomarkerOrigin.BASE ? { width: '60%', minHeight: '60%' } : undefined}
                            onClose={() => {
                                if (this.state.biomarkerTypeSelected !== BiomarkerOrigin.BASE) {
                                    this.handleChangeConfirmModalState(
                                        true,
                                        'You are going to lose all the data inserted',
                                        'Are you sure?',
                                        this.closeBiomarkerModal
                                    )
                                } else {
                                    this.closeBiomarkerModal()
                                }
                            }}
                        >
                            {this.state.biomarkerTypeSelected === BiomarkerOrigin.BASE &&
                            <BiomarkerTypeSelection handleSelectModal={this.handleSelectModal} />}

                            {this.state.biomarkerTypeSelected === BiomarkerOrigin.MANUAL && (
                                <ManualForm
                                    handleChangeInputForm={this.handleChangeInputForm}
                                    handleChangeMoleculeInputSelected={this.handleChangeMoleculeInputSelected}
                                    handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                                    biomarkerForm={this.state.formBiomarker}
                                    checkedIgnoreProposedAlias={this.state.checkedIgnoreProposedAlias}
                                    handleChangeIgnoreProposedAlias={this.handleChangeIgnoreProposedAlias}
                                    cleanForm={this.cleanForm}
                                    isFormEmpty={this.isFormEmpty}
                                    handleAddMoleculeToSection={this.handleAddMoleculeToSection}
                                    handleRemoveMolecule={this.handleRemoveMolecule}
                                    handleGenesSymbolsFinder={this.handleGenesSymbolsFinder}
                                    handleGenesSymbols={this.handleGeneSymbols}
                                    handleSelectOptionMolecule={this.handleSelectOptionMolecule}
                                    handleRemoveInvalidGenes={this.handleRemoveInvalidGenes}
                                    handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                                    handleValidateForm={this.handleValidateForm}
                                    handleSendForm={this.handleSendForm}
                                    handleChangeCheckBox={this.handleChangeCheckBox}
                                    handleRestartSection={this.handleRestartSection}
                                    tags={this.state.tags}
                                    tagOptions={[
                                        { key: 'no_tag', value: '', text: 'No tag' },
                                        ...this.state.tags.map((tag) => {
                                            const id = tag.id as number
                                            return { key: id, value: id, text: tag.name }
                                        })
                                    ]}
                                    handleAddFileInputsChange={this.handleAddFileInputsChange}
                                    handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                    removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                />
                            )}

                            {this.state.biomarkerTypeSelected === BiomarkerOrigin.FEATURE_SELECTION && (
                                <FeatureSelectionPanel
                                    featureSelection={this.state.featureSelection}
                                    getDefaultFilters={this.getDefaultFilters()}
                                    markBiomarkerAsSelected={this.markBiomarkerAsSelected}
                                    handleCompleteStep1={this.handleCompleteStep1}
                                    handleCompleteStep2={this.handleCompleteStep2}
                                    selectNewFile={this.selectNewFile}
                                    selectStudy={this.selectStudy}
                                    selectUploadedFile={this.selectUploadedFile}
                                    handleChangeSourceType={this.handleChangeSourceType}
                                    handleChangeAlgorithm={this.handleChangeAlgorithm}
                                    handleChangeFitnessFunction={this.handleChangeFitnessFunction}
                                    handleChangeFitnessFunctionOption={this.handleChangeFitnessFunctionOption}
                                    handleChangeCrossValidation={this.handleChangeCrossValidation}
                                    handleGoBackStep1={this.handleGoBackStep1}
                                    handleGoBackStep2={this.handleGoBackStep2}
                                    submitFeatureSelectionExperiment={this.submitFeatureSelectionExperiment}
                                    handleChangeAdvanceAlgorithm={this.handleChangeAdvanceAlgorithm}
                                    handleSwitchAdvanceAlgorithm={this.handleSwitchAdvanceAlgorithm}
                                    cancelForm={() => this.handleChangeConfirmModalState(true, 'You are going to lose all the data inserted', 'Are you sure?', this.closeBiomarkerModal)}
                                />
                            )}
                        </Modal>

                        {/* Biomarker details modal. */}
                        <Modal
                            className='large-modal'
                            closeIcon={<Icon name='close' size='large' />}
                            closeOnEscape={false}
                            closeOnDimmerClick={false}
                            closeOnDocumentClick={false}
                            centered={false}
                            onClose={this.closeBiomarkerDetailsModal}
                            open={this.state.openDetailsModal}
                        >
                            <BiomarkerDetailsModal selectedBiomarker={this.state.selectedBiomarker} />
                        </Modal>

                        <Confirm
                            open={this.state.confirmModal.confirmModal}
                            header={this.state.confirmModal.headerText}
                            content={this.state.confirmModal.contentText}
                            size='large'
                            onCancel={() => this.handleCancelConfirmModalState()}
                            onConfirm={() => {
                                this.state.confirmModal.onConfirm()

                                this.setState(prevState => {
                                    return {
                                        confirmModal: {
                                            ...prevState.confirmModal,
                                            confirmModal: false
                                        }
                                    }
                                })
                            }}
                        />
                        <SharedUsersBiomarker
                            {...this.state.modalUsers}
                            handleClose={this.handleCloseModalModalUser}
                            handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                        />
                        <SharedInstitutionsBiomarker
                            user={this.state.modalInstitutions.user}
                            isOpen={this.state.modalInstitutions.isOpen}
                            institutions={this.state.modalInstitutions.institutions}
                            handleClose={this.handleCloseModalModalInstitution}
                            biomarkerId={this.state.modalInstitutions.biomarkerId}
                            handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                            isAdding={this.state.modalInstitutions.isAdding}
                        />

                        <Alert
                            onClose={this.handleCloseAlert}
                            isOpen={this.state.alert.isOpen}
                            message={this.state.alert.message}
                            type={this.state.alert.type}
                            duration={this.state.alert.duration}
                        />
                    </Grid.Column>
                </Grid>
            </Base>
        )
    }
}
