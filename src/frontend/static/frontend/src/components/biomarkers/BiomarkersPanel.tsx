import React from 'react'
import { Base } from '../Base'
import { Header, Button, Modal, Table, DropdownItemProps, Icon, Confirm, Form } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoSurvivalColumnsTupleSimple, DjangoTag, DjangoUserFile, TagType } from '../../utils/django_interfaces'
import ky, { Options } from 'ky'
import { getDjangoHeader, alertGeneralError, formatDateLocale, cleanRef, getFilenameFromSource, makeSourceAndAppend, getDefaultSource } from '../../utils/util_functions'
import { NameOfCGDSDataset, Nullable, CustomAlert, CustomAlertTypes, SourceType, OkResponse } from '../../utils/interfaces'
import { Biomarker, BiomarkerType, BiomarkerOrigin, ConfirmModal, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection, SaveBiomarkerStructure, SaveMoleculeStructure, FeatureSelectionPanelData, SourceStateBiomarker, FeatureSelectionAlgorithm, FitnessFunction, FitnessFunctionParameters, BiomarkerState, AdvancedAlgorithm as AdvancedAlgorithmParameters, BBHAVersion, BiomarkerSimple, CrossValidationParameters } from './types'
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

// Styles
import './../../css/biomarkers.css'
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'
import { DeleteExperimentButton } from '../pipeline/all-experiments-view/DeleteExperimentButton'

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

/** A matched molecule with the search query and the validated alias. */
type MoleculeFinderResult = { molecule: string, standard: string }

/** Extremely simple struct of a Biomarker (useful for simple updates). */
type BiomarkerNameAndDesc = {
    name: string,
    description: string
}

/** Some flags to validate the Biomarkers form. */
type ValidationForm = {
    haveAmbiguous: boolean,
    haveInvalid: boolean
}

/** BiomarkersPanel's state */
interface BiomarkersPanelState {
    biomarkers: BiomarkerSimple[],
    newBiomarker: Biomarker,
    /** PK of the Biomarker that's being loaded. */
    loadingFullBiomarkerId: Nullable<number>,
    selectedBiomarkerToDeleteOrSync: Nullable<BiomarkerSimple>,
    checkedIgnoreProposedAlias: boolean,
    showDeleteBiomarkerModal: boolean,
    /** Indicates if there's a Biomarker being deleted. */
    deletingBiomarker: boolean,
    /** Indicates if there's a Biomarker being stopped. */
    stoppingExperiment: boolean,
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
    alert: CustomAlert,
    featureSelection: FeatureSelectionPanelData,
    submittingFSExperiment: boolean
}

/**
 * Renders a CRUD panel for a Biomarker.
 */
export class BiomarkersPanel extends React.Component<{}, BiomarkersPanelState> {
    constructor (props) {
        super(props)

        this.state = {
            biomarkers: [],
            newBiomarker: this.getDefaultNewBiomarker(),
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
            confirmModal: this.getDefaultConfirmModal(),
            tags: [],
            openCreateEditBiomarkerModal: false,
            cloningBiomarker: false,
            biomarkerToClone: null,
            openDetailsModal: false,
            selectedBiomarker: null,
            alert: this.getDefaultAlertProps(),
            featureSelection: this.getDefaultFeatureSelectionProps(),
            submittingFSExperiment: false
        }
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
        const formBiomarker = this.state.formBiomarker
        formBiomarker.moleculesSymbolsFinder.data = []

        this.setState({ checkedIgnoreProposedAlias, formBiomarker })
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
            BBHAVersion: BBHAVersion.ORIGINAL
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
        const featureSelection = this.state.featureSelection
        featureSelection.advancedAlgorithmParameters.isActive = !featureSelection.advancedAlgorithmParameters.isActive
        this.setState({ featureSelection })
    }

    /**
     * Change the value of the advance algorithm and prop selected
     * @param advanceAlgorithm Advance algorithm selected
     * @param name name of prop to change
     * @param value value to set
     */
    handleChangeAdvanceAlgorithm = (advanceAlgorithm: string, name: string, value: any) => {
        const featureSelection = this.state.featureSelection
        featureSelection.advancedAlgorithmParameters[advanceAlgorithm][name] = value
        this.setState({ featureSelection })
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
        const featureSelection = this.state.featureSelection
        featureSelection.algorithm = algorithm
        this.setState({ featureSelection })
    }

    /**
     * Select the algorithm, initialize the state of the selected and clean the others states
     * @param fitnessFunction Fitness function selected
     */
    handleChangeFitnessFunction = (fitnessFunction: FitnessFunction) => {
        const featureSelection = this.state.featureSelection
        featureSelection.fitnessFunction = fitnessFunction
        this.setState({ featureSelection })
    }

    /**
     * Manage changes of Feature Selection process parameters.
     * @param fitnessFunction name of fitness function to change
     * @param key name of the fitnessFunction object that have changed
     * @param value value selected typed depends of what fitness function and key is being changing
     */
    handleChangeFitnessFunctionOption = <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => {
        const featureSelection = this.state.featureSelection
        featureSelection.fitnessFunctionParameters[fitnessFunction][key] = value
        this.setState({ featureSelection })
    }

    /**
     * Manage changes of CrossValidation parameters.
     * @param key name of the crossValidationParameters object that have changed.
     * @param value value selected.
     */
    handleChangeCrossValidation = <T extends keyof CrossValidationParameters>(key: T, value: any) => {
        const featureSelection = this.state.featureSelection
        featureSelection.crossValidationParameters[key] = value
        this.setState({ featureSelection })
    }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const featureSelection = this.state.featureSelection
        const source = featureSelection[sourceStateName]

        source.type = SourceType.CGDS
        source.CGDSStudy = selectedStudy
        this.setState({ featureSelection }, this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const featureSelection = this.state.featureSelection
        const source = featureSelection[sourceStateName]

        source.type = SourceType.UPLOADED_DATASETS
        source.selectedExistingFile = selectedFile
        this.setState({ featureSelection }, this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    handleChangeSourceType = (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const featureSelection = this.state.featureSelection
        const source = featureSelection[sourceStateName]
        // Change source type
        source.type = sourceType

        // Resets all source values
        source.selectedExistingFile = null
        source.CGDSStudy = null
        cleanRef(source.newUploadedFileRef)

        // After update state
        this.setState({ featureSelection }, this.updateSourceFilenamesAndCommonSamples)
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
        const featureSelection = this.state.featureSelection
        featureSelection.mRNASource.filename = getFilenameFromSource(featureSelection.mRNASource)
        featureSelection.clinicalSource.filename = getFilenameFromSource(featureSelection.clinicalSource)
        featureSelection.cnaSource.filename = getFilenameFromSource(featureSelection.cnaSource)
        featureSelection.methylationSource.filename = getFilenameFromSource(featureSelection.methylationSource)
        featureSelection.mirnaSource.filename = getFilenameFromSource(featureSelection.mirnaSource)
        this.setState({ featureSelection })
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => {
        const confirmModal = this.state.confirmModal
        confirmModal.confirmModal = setOption
        confirmModal.headerText = headerText
        confirmModal.contentText = contentText
        confirmModal.onConfirm = onConfirm
        this.setState({ confirmModal })
    }

    /**
     * Disambiguate the selected molecule for the yellow buttons.
     * @param moleculeToDisambiguate Molecule to disambiguate.
     * @param section Molecule section.
     * @param selectedOption Selected option.
     */
    handleSelectOptionMolecule = (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => {
        const formBiomarker = this.state.formBiomarker
        const indexToSelect = formBiomarker.moleculesSection[section].data.findIndex((item) => isEqual(item.value, moleculeToDisambiguate.value))

        // Checks if the molecule is already a valid one
        const exists = formBiomarker.moleculesSection[section].data.some((item) => item.value === selectedOption)
        const data: MoleculesSectionData[] = formBiomarker.moleculesSection[section].data
        data.splice(indexToSelect, 1)
        if (!exists) {
            data.push({
                isValid: true,
                value: selectedOption
            })
        }

        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [section]: {
                        ...this.state.formBiomarker.moleculesSection[section],
                        data
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
            ky.get(urlBiomarkersCRUD + '/' + biomarkerSimple.id + '/').then((response) => {
                response.json().then(resolve).catch((err) => {
                    console.error('Error parsing JSON on Biomarker retrieval:', err)
                    reject(err)
                })
            }).catch((err) => {
                console.error('Error getting Biomarker:', err)
                reject(err)
            }).finally(() => {
                this.setState({ loadingFullBiomarkerId: null })
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
        // loading aca
        const formBiomarkerPreLoad = this.state.formBiomarker
        formBiomarkerPreLoad.moleculesSymbolsFinder.isLoading = true
        let urlToFind = urlGeneSymbolsFinder
        switch (this.state.formBiomarker.moleculeSelected) {
            case BiomarkerType.MIRNA:
                urlToFind = urlMiRNACodesFinder
                break
            case BiomarkerType.METHYLATION:
                urlToFind = urlMethylationSitesFinder
                break
            default:
                break
        }

        this.setState({ formBiomarker: formBiomarkerPreLoad })

        ky.get(urlToFind, { searchParams: { query, limit: 5 }, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json().then((jsonResponse: MoleculeFinderResult[]) => {
                const formBiomarker = this.state.formBiomarker
                const checkedIgnoreProposedAlias = this.state.checkedIgnoreProposedAlias // For short

                formBiomarker.moleculesSymbolsFinder.data = jsonResponse.map(molecule => {
                    const text = checkedIgnoreProposedAlias || molecule.molecule === molecule.standard
                        ? molecule.molecule
                        : `${molecule.molecule} (${molecule.standard})`

                    return {
                        key: molecule.molecule,
                        text,
                        value: checkedIgnoreProposedAlias ? molecule.molecule : molecule.standard
                    }
                })
                this.setState({ formBiomarker })
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting genes ->', err)
        }).finally(() => {
            const formBiomarker = this.state.formBiomarker
            formBiomarker.moleculesSymbolsFinder.isLoading = false
            this.setState({ formBiomarker })
        })
    }

    /**
     * Method that removes invalid genes of the sector selected
     * @param sector string of the sector selected to change state
     */
    handleRemoveInvalidGenes = (sector: BiomarkerType): void => {
        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [sector]: {
                        ...this.state.formBiomarker.moleculesSection[sector],
                        data: this.state.formBiomarker.moleculesSection[sector].data.filter(gen => gen.isValid || Array.isArray(gen.value))
                    }
                }
            }
        })
    }

    /**
     * Method that removes all the molecules of the sector selecterd
     * @param sector string of the sector selected to change state
     */
    handleRestartSection = (sector: BiomarkerType): void => {
        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [sector]: {
                        ...this.state.formBiomarker.moleculesSection[sector],
                        data: []
                    }
                }
            }
        })
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
     * Method that gets symbols while user is writing in Select molecules input
     * @param molecules array of strings that is sending to the api
     */
    handleGeneSymbols = (molecules: string[]): void => {
        const moleculesSectionPreload = {
            ...this.state.formBiomarker.moleculesSection,
            [this.state.formBiomarker.moleculeSelected]: {
                isLoading: true,
                data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data]
            }
        }

        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: moleculesSectionPreload
            }
        })

        let urlToFind: string
        let json: {[key: string]: string[]}
        switch (this.state.formBiomarker.moleculeSelected) {
            case BiomarkerType.MIRNA:
                urlToFind = urlMiRNACodes
                json = { mirna_codes: molecules }
                break
            case BiomarkerType.METHYLATION:
                urlToFind = urlMethylationSites
                json = { methylation_sites: molecules }
                break
            default:
                urlToFind = urlGeneSymbols
                json = { gene_ids: molecules }
                break
        }

        ky.post(urlToFind, { headers: getDjangoHeader(), json, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json().then((jsonResponse: { [key: string]: string[] }) => {
                const genes = Object.entries(jsonResponse)
                const genesArray: MoleculesSectionData[] = []

                genes.forEach(gene => {
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
                })
                const moleculesSection = {
                    ...this.state.formBiomarker.moleculesSection,
                    [this.state.formBiomarker.moleculeSelected]: {
                        isLoading: false,
                        data: this.orderData([...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data].concat(genesArray))
                    }
                }
                this.setState({
                    formBiomarker: {
                        ...this.state.formBiomarker,
                        moleculesSection
                    }
                })
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting genes ->', err)
        }).finally(() => {
            // Sets loading in false
            const formBiomarker = this.state.formBiomarker
            formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].isLoading = false
            this.setState({ formBiomarker })
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
        const formBiomarker = this.state.formBiomarker
        formBiomarker.validation.checkBox = value
        this.setState({ formBiomarker })
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
        formBiomarker.validation.isLoading = true
        this.setState({ formBiomarker })

        // Gets name and description
        const simpleBiomarker: BiomarkerNameAndDesc = {
            name: formBiomarker.biomarkerName,
            description: formBiomarker.biomarkerDescription
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
                response.json().then((_jsonResponse: Biomarker) => {
                    this.closeModalWithSuccessMsg('Biomarker created successfully')
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error adding Biomarker ->', err)
                const alert = this.state.alert
                alert.isOpen = true
                alert.type = CustomAlertTypes.ERROR
                alert.message = 'Error creating biomarker!'
                this.setState({ alert })
            }).finally(() => {
                formBiomarker.validation.isLoading = false
                this.setState({ formBiomarker })
            })
        } else {
            const url = formBiomarker.canEditMolecules ? urlBiomarkersCRUD : urlBiomarkersSimpleUpdate
            ky.patch(`${url}/${formBiomarker.id}/`, settings).then((response) => {
                response.json().then((_jsonResponse: Biomarker) => {
                    this.closeModalWithSuccessMsg('Biomarker edited successfully')
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error getting genes ->', err)
                const alert = this.state.alert
                alert.isOpen = true
                alert.type = CustomAlertTypes.ERROR
                alert.message = 'Error editing biomarker!'
                this.setState({ alert })
            }).finally(() => {
                formBiomarker.validation.isLoading = false
                this.setState({ formBiomarker })
            })
        }
    }

    /**
     * change name or description of manual form
     * @param value new value for input form
     * @param name type of input to change
     */
    handleChangeInputForm = (value: string, name: 'biomarkerName' | 'biomarkerDescription') => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker[name] = value
        this.setState({ formBiomarker })
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
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to set to the state moleculesTypeOfSelection in formBiomarkerState
     */
    handleChangeMoleculeInputSelected = (value: MoleculesTypeOfSelection) => {
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesTypeOfSelection: value
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to add to the molecules section that is selected
     */
    handleAddMoleculeToSection = (value: MoleculesSectionData) => {
        const genesSymbolsFinder = this.state.formBiomarker.moleculesSymbolsFinder
        genesSymbolsFinder.data = []
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSymbolsFinder: genesSymbolsFinder
            }
        })

        const sectionFound = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.find((item: MoleculesSectionData) => value.value === item.value)
        if (sectionFound !== undefined) {
            return
        }
        const moleculesSection = {
            ...this.state.formBiomarker.moleculesSection,
            [this.state.formBiomarker.moleculeSelected]: {
                isLoading: false,
                data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data, value]
            }
        }
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection
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

        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [section]: {
                        isLoading: false,
                        data
                    }
                }
            }
        })
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewBiomarker (): Biomarker {
        return {
            id: null,
            name: '',
            description: '',
            tag: null,
            number_of_mrnas: 0,
            number_of_mirnas: 0,
            number_of_cnas: 0,
            number_of_methylations: 0,
            has_fs_experiment: false,
            was_already_used: false,
            origin: BiomarkerOrigin.BASE,
            state: BiomarkerState.COMPLETED,
            contains_nan_values: false,
            column_used_as_index: '',
            methylations: [],
            mirnas: [],
            cnas: [],
            mrnas: []
        }
    }

    /**
     * When the component has been mounted, It requests for
     * tags and files
     */
    componentDidMount () {
        this.getUserTags()
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
     * Check if can submit the new Biomarker form
     * @returns True if everything is OK, false otherwise
     */
    canSubmitBiomarkerForm = (): boolean => {
        return !this.state.addingOrEditingBiomarker &&
            this.state.newBiomarker.name.trim().length > 0
    }

    /**
     * Handles Biomarker form changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     */
    handleFormChanges = (name: string, value) => {
        const newBiomarker = this.state.newBiomarker
        newBiomarker[name] = value
        this.setState({ newBiomarker })
    }

    /**
     * TODO: Check if needed
     * Adds a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     */
    addSurvivalFormTuple = (datasetName: NameOfCGDSDataset) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]

        if (dataset !== null) {
            const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }
            if (dataset.survival_columns === undefined) {
                dataset.survival_columns = []
            }
            dataset.survival_columns.push(newElement)
            this.setState({ newBiomarker })
        }
    }

    /**
     * TODO: Check if needed
     * Removes a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (datasetName: NameOfCGDSDataset, idxSurvivalTuple: number) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns.splice(idxSurvivalTuple, 1)
            this.setState({ newBiomarker })
        }
    }

    /**
     * TODO: Check if needed
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param datasetName Name of the edited CGDS dataset
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (
        datasetName: NameOfCGDSDataset,
        idxSurvivalTuple: number,
        name: string,
        value: any
    ) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns[idxSurvivalTuple][name] = value
            this.setState({ newBiomarker })
        }
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
        ky.get(url, { searchParams: { limit: 5 }, timeout: REQUEST_TIMEOUT }).then((response) => {
            response.json().then((responseJSON: OkResponse) => {
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
            alertGeneralError()
        }).finally(() => {
            this.setState({ cloningBiomarker: false })
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
                response.json().then((responseJSON: OkResponse) => {
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
     * Generates default table's Filters
     * @returns Default object for table's Filters
     */
    getDefaultFilters (): PaginationCustomFilter[] {
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', options: tagOptions }
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

        ky.get(urlTagsCRUD, { searchParams }).then((response) => {
            response.json().then((tags: DjangoTag[]) => {
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

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()
        const experimentStopConfirmModal = this.getExperimentStopConfirmModals()

        const isLoadingFullBiomarker = this.state.loadingFullBiomarkerId !== null

        return (
            <Base activeItem='biomarkers' wrapperClass='wrapper'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                {/* Experiment stopping confirm modal */}
                {experimentStopConfirmModal}

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
                        { name: 'Actions' }
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
                        const isFinished = !(biomarker.state === BiomarkerState.IN_PROCESS ||
                            biomarker.state === BiomarkerState.WAITING_FOR_QUEUE)

                        return (
                            <Table.Row key={biomarker.id as number}>
                                <TableCellWithTitle value={biomarker.name} />
                                <TableCellWithTitle value={biomarker.description} />
                                <Table.Cell><TagLabel tag={biomarker.tag} /></Table.Cell>
                                <Table.Cell textAlign='center'><BiomarkerStateLabel biomarkerState={biomarker.state}/></Table.Cell>
                                <Table.Cell><BiomarkerOriginLabel biomarkerOrigin={biomarker.origin}/></Table.Cell>
                                <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'L')} />
                                <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_mrnas : '-'}</Table.Cell>
                                <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_mirnas : '-'}</Table.Cell>
                                <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_cnas : '-'}</Table.Cell>
                                <Table.Cell>{showNumberOfMolecules ? biomarker.number_of_methylations : '-'}</Table.Cell>
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
                                        <Icon
                                            name={currentBiomarkerIsLoading ? 'spinner' : 'pencil'}
                                            className='clickable margin-left-5'
                                            color={canEditMolecules ? 'yellow' : 'orange'}
                                            loading={currentBiomarkerIsLoading}
                                            disabled={isLoadingFullBiomarker}
                                            title={`Edit (${canEditMolecules ? 'full' : 'name and description'}) biomarker`}
                                            onClick={() => this.handleOpenEditBiomarker(biomarker)}
                                        />

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
                                        {!isFinished &&
                                            <StopExperimentButton
                                                title='Stop experiment'
                                                onClick={() => this.setState({ biomarkerToStop: biomarker })}
                                            />
                                        }

                                        {/* Delete button */}
                                        {isFinished &&
                                            <DeleteExperimentButton
                                                title='Delete experiment'
                                                disabled={currentBiomarkerIsLoading}
                                                onClick={() => this.confirmBiomarkerDeletion(biomarker)}
                                            />
                                        }
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
                    style={this.state.biomarkerTypeSelected === BiomarkerOrigin.BASE ? { width: '60%', minHeight: '60%' } : { width: '92%', minHeight: '92%', display: 'flex' }}
                    onClose={() => {
                        this.state.biomarkerTypeSelected !== BiomarkerOrigin.BASE
                            ? this.handleChangeConfirmModalState(
                                true,
                                'You are going to lose all the data inserted',
                                'Are you sure?',
                                this.closeBiomarkerModal
                            )
                            : this.closeBiomarkerModal()
                    }}
                >
                    {this.state.biomarkerTypeSelected === BiomarkerOrigin.BASE &&
                        <BiomarkerTypeSelection handleSelectModal={this.handleSelectModal} />
                    }

                    {this.state.biomarkerTypeSelected === BiomarkerOrigin.MANUAL &&
                        <ManualForm
                            handleChangeInputForm={this.handleChangeInputForm}
                            handleChangeMoleculeInputSelected={this.handleChangeMoleculeInputSelected}
                            handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                            biomarkerForm={this.state.formBiomarker}
                            checkedIgnoreProposedAlias={this.state.checkedIgnoreProposedAlias}
                            handleChangeIgnoreProposedAlias={this.handleChangeIgnoreProposedAlias}
                            removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                            handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
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
                        />
                    }

                    {this.state.biomarkerTypeSelected === BiomarkerOrigin.FEATURE_SELECTION &&
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
                    }
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
                    <BiomarkerDetailsModal selectedBiomarker={this.state.selectedBiomarker}/>
                </Modal>

                <Confirm
                    className='biomarkers--confirm--modal'
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    size="large"
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => this.state.confirmModal.onConfirm()}
                />

                <Alert
                    onClose={this.handleCloseAlert}
                    isOpen={this.state.alert.isOpen}
                    message={this.state.alert.message}
                    type={this.state.alert.type}
                    duration={this.state.alert.duration}
                />
            </Base>
        )
    }
}
