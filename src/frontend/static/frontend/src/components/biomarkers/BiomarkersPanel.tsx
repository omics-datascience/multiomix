import React from 'react'
import { Base } from '../Base'
import { Header, Button, Modal, Table, DropdownItemProps, Icon, Confirm, Form } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoSurvivalColumnsTupleSimple, DjangoTag, DjangoUserFile, RowHeader, TagType } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, formatDateLocale, cleanRef, getFilenameFromSource } from '../../utils/util_functions'
import { NameOfCGDSDataset, Nullable, CustomAlert, CustomAlertTypes, SourceType, Source } from '../../utils/interfaces'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { Biomarker, BiomarkerType, BiomarkerTypeSelected, ConfirmModal, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection, SaveBiomarkerStructure, SaveMoleculeStructure, FeatureSelectionPanelData, SourceStateBiomarker, FeatureSelectionAlgorithms, BlindSearchFeatureSelection, BlindSearchFitnessFunction, ClusteringParameters, ClusteringButtons } from './types'
import { ManualForm } from './modalContentBiomarker/manualForm/ManualForm'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'
import _ from 'lodash'
import './../../css/biomarkers.css'
import { BiomarkerTypeSelection } from './modalContentBiomarker/biomarkerTypeSelection/BiomarkerTypeSelection'
import { FeatureSelectionPanel } from './modalContentBiomarker/featureSelectionPanel/FeatureSelectionPanel'
import { Alert } from '../common/Alert'
// URLs defined in biomarkers.html
declare const urlBiomarkersCRUD: string
declare const urlTagsCRUD: string
declare const urlGeneSymbols: string
declare const urlGeneSymbolsFinder: string
declare const urlMiRNACodes: string
declare const urlMiRNACodesFinder: string
declare const urlMethylationSites: string
declare const urlMethylationSitesFinder: string

/** Some flags to validate the Biomarkers form. */
type ValidationForm = {
    haveAmbiguous: boolean,
    haveInvalid: boolean
}

/** BiomarkersPanel's state */
interface BiomarkersPanelState {
    biomarkers: Biomarker[],
    newBiomarker: Biomarker,
    selectedBiomarkerToDeleteOrSync: Nullable<Biomarker>,
    showDeleteBiomarkerModal: boolean,
    deletingBiomarker: boolean,
    addingOrEditingBiomarker: boolean,
    biomarkerTypeSelected: BiomarkerTypeSelected,
    formBiomarker: FormBiomarkerData,
    confirmModal: ConfirmModal
    tags: DjangoTag[],
    isOpenModal: boolean,
    alert: CustomAlert,
    featureSelection: FeatureSelectionPanelData
}

/**
 * Renders a CRUD panel for a Biomarker
 */
export class BiomarkersPanel extends React.Component<{}, BiomarkersPanelState> {
    filterTimeout: number | undefined;
    websocketClient: WebsocketClientCustom;
    constructor (props) {
        super(props)

        this.state = {
            biomarkers: [],
            biomarkerTypeSelected: BiomarkerTypeSelected.BASE,
            newBiomarker: this.getDefaultNewBiomarker(),
            showDeleteBiomarkerModal: false,
            selectedBiomarkerToDeleteOrSync: null,
            deletingBiomarker: false,
            addingOrEditingBiomarker: false,
            formBiomarker: this.getDefaultFormBiomarker(),
            confirmModal: this.getDefaultConfirmModal(),
            tags: [],
            isOpenModal: false,
            alert: this.getDefaultAlertProps(),
            featureSelection: this.getDefaultfeatureSelectionProps()
        }
    }

    /**
     * Generates default feature selection creation structure
     * @returns Default the default Alert
     */
    getDefaultfeatureSelectionProps = (): FeatureSelectionPanelData => {
        return {
            step: 1,
            biomarker: null,
            selectedBiomarker: null,
            clinicalSource: this.getDefaultSource(),
            mRNASource: this.getDefaultSource(),
            mirnaSource: this.getDefaultSource(),
            methylationSource: this.getDefaultSource(),
            cnaSource: this.getDefaultSource(),
            algorithm: FeatureSelectionAlgorithms.BLIND_SEARCH,
            [FeatureSelectionAlgorithms.BLIND_SEARCH]: this.getDefaultBlindSearch()
        }
    }

    /**
     * Generates default feature selection blind search creation structure
     * @returns Default Blind search structure
     */
    getDefaultBlindSearch = (): BlindSearchFeatureSelection => {
        return {
            fitnessFunction: BlindSearchFitnessFunction.CLUSTERING,
            [BlindSearchFitnessFunction.CLUSTERING]: {
                parameters: ClusteringParameters.K_MEANS,
                selection: ClusteringButtons.COX_REGRESSION
            }
        }
    }

    /**
     * Generates a default Source
     * @param msg Message to show as default filename
     * @returns A source with all the field with default values
     */
    getDefaultSource = (msg: string = 'Choose File'): Source => {
        return {
            type: SourceType.NONE,
            filename: msg,
            newUploadedFileRef: React.createRef(),
            selectedExistingFile: null,
            CGDSStudy: null
        }
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

    /**
     * Reset the confirm modal, to be used again
     */
    handleCloseAlert = () => {
        const alert = this.state.alert
        alert.isOpen = false
        this.setState({
            alert: alert
        })
    }

    /**
     * Reset the confirm modal, to be used again
     */
    handleCancelConfirmModalState () {
        this.setState({
            confirmModal: this.getDefaultConfirmModal()
        })
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    selectNewFile = () => { this.updateSourceFilenamesAndCommonSamples() }

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
     * TODO: document
     * @param molecule TODO: document
     * @param section TODO: document
     * @param itemSelected TODO: document
     */
    handleSelectOptionMolecule = (molecule: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => {
        const indexChosen = this.state.formBiomarker.moleculesSection[section].data.findIndex((item) => item.value === itemSelected)
        const newFormBiomarkerByMoleculesSection: FormBiomarkerData = {
            ...this.state.formBiomarker
        }
        if (indexChosen !== -1) {
            newFormBiomarkerByMoleculesSection.moleculesSection[section].data = [...newFormBiomarkerByMoleculesSection.moleculesSection[section].data].filter(
                (item) => _.isEqual(item.value, molecule.value)
            )
        } else {
            const indexToSelect = this.state.formBiomarker.moleculesSection[section].data.findIndex(
                (item) => _.isEqual(item.value, molecule.value)
            )
            const sectionModified = [...this.state.formBiomarker.moleculesSection[section].data]
            sectionModified[indexToSelect].isValid = true
            sectionModified[indexToSelect].value = itemSelected
            newFormBiomarkerByMoleculesSection.moleculesSection[section].data = sectionModified
        }

        this.setState({ formBiomarker: newFormBiomarkerByMoleculesSection })
    }

    /**
     * Method that select how the user is going to create a Biomarker
     * @param type Select the way to create a Biomarker
     */

    handleSelectModal = (type: BiomarkerTypeSelected) => {
        this.setState(
            {
                biomarkerTypeSelected: type
            }
        )
    }
    /**
     * Method that select how the user is going to create a Biomarker
     * @param biomarker Biomarker selected to update
     */

    handleOpenEditBiomarker = (biomarker: Biomarker) => {
        this.setState(
            {
                biomarkerTypeSelected: BiomarkerTypeSelected.MANUAL,
                isOpenModal: true,
                formBiomarker: {
                    id: biomarker.id,
                    biomarkerName: biomarker.name,
                    biomarkerDescription: biomarker.description,
                    tag: biomarker.tag,
                    moleculeSelected: BiomarkerType.MIRNA,
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
            }
        )
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
        this.setState({
            formBiomarker: formBiomarkerPreLoad
        })
        ky.get(urlToFind, { searchParams: { query, limit: 5 } }).then((response) => {
            response.json().then((jsonResponse: string[]) => {
                const formBiomarker = this.state.formBiomarker
                formBiomarker.moleculesSymbolsFinder.data = jsonResponse.map(gen => ({
                    key: gen,
                    text: gen,
                    value: gen
                }))
                this.setState({
                    formBiomarker: formBiomarker
                })
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
        const formBiomarker = this.state.formBiomarker
        formBiomarker.moleculesSection[sector].data = this.state.formBiomarker.moleculesSection[sector].data.filter(gen => !(!gen.isValid && !Array.isArray(gen.value)))
        this.setState({
            formBiomarker: formBiomarker
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

        ky.post(urlToFind, { headers: getDjangoHeader(), json }).then((response) => {
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
                                item => _.isEqual(item.value, gene[1])
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
                        data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data].concat(genesArray)
                    }
                }
                this.setState({
                    formBiomarker: {
                        ...this.state.formBiomarker,
                        moleculesSection: moleculesSection
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
            tag: null,
            moleculeSelected: BiomarkerType.MIRNA,
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
            haveAmbiguous: haveAmbiguous,
            haveInvalid: haveInvalid
        }
    }

    /**
     * Generates a valid structure to send the molecule to backend and create the Biomarker
     * @param item Molecule to send
     * @returns Correct structure to send
     */
    getValidMoleculeIdentifier = (item: MoleculesSectionData): SaveMoleculeStructure => {
        return (!Array.isArray(item.value) && item.isValid
            ? { identifier: item.value }
            : { identifier: '' })
    }

    /**
     * Makes the request to create a Biomarker
     */
    createBiomarker = () => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker.validation.isLoading = true
        this.setState({ formBiomarker })

        const biomarkerToSend: SaveBiomarkerStructure = {
            name: formBiomarker.biomarkerName,
            description: formBiomarker.biomarkerDescription,
            mrnas: formBiomarker.moleculesSection.mRNA.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0),
            mirnas: formBiomarker.moleculesSection.miRNA.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0),
            methylations: formBiomarker.moleculesSection.Methylation.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0),
            cnas: formBiomarker.moleculesSection.CNA.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0)
        }
        const settings = {
            headers: getDjangoHeader(),
            json: biomarkerToSend
        }
        formBiomarker.validation.isLoading = false
        this.setState({ formBiomarker })
        if (!formBiomarker.id) {
            ky.post(urlBiomarkersCRUD, settings).then((response) => {
                response.json().then((jsonResponse: Biomarker) => {
                    console.log(jsonResponse)
                    const alert = this.state.alert
                    alert.isOpen = true
                    alert.type = CustomAlertTypes.SUCCESS
                    alert.message = 'Biomarker created sucessfully!'
                    this.setState({
                        alert,
                        formBiomarker: this.getDefaultFormBiomarker(),
                        isOpenModal: false,
                        confirmModal: this.getDefaultConfirmModal(),
                        biomarkerTypeSelected: BiomarkerTypeSelected.BASE
                    })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error getting genes ->', err)
                const alert = this.state.alert
                alert.isOpen = true
                alert.type = CustomAlertTypes.ERROR
                alert.message = 'Error creating biomarker!'
                formBiomarker.validation.isLoading = false
                this.setState({ alert, formBiomarker })
            })
        } else {
            ky.patch(urlBiomarkersCRUD + `/${formBiomarker.id}/`, settings).then((response) => {
                response.json().then((jsonResponse: Biomarker) => {
                    console.log(jsonResponse)
                    const alert = this.state.alert
                    alert.isOpen = true
                    alert.type = CustomAlertTypes.SUCCESS
                    alert.message = 'Biomarker edited sucessfully!'
                    this.setState({
                        alert,
                        formBiomarker: this.getDefaultFormBiomarker(),
                        isOpenModal: false,
                        confirmModal: this.getDefaultConfirmModal(),
                        biomarkerTypeSelected: BiomarkerTypeSelected.BASE
                    })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error getting genes ->', err)
                const alert = this.state.alert
                alert.isOpen = true
                alert.type = CustomAlertTypes.ERROR
                alert.message = 'Error editing biomarker!'
                formBiomarker.validation.isLoading = false
                this.setState({ alert, formBiomarker })
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
        this.setState({
            formBiomarker: formBiomarker
        })
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
                moleculesSection: moleculesSection
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param section Value to add to the molecules section that is selected
     * @param molecule molecule to remove of the array
     */
    handleRemoveMolecule = (section: BiomarkerType, molecule: MoleculesSectionData) => {
        const data = this.state.formBiomarker.moleculesSection[section].data.map((item: MoleculesSectionData) => {
            if (item.value === molecule.value) return
            return item
        })

        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [section]: {
                        isLoading: false,
                        data: data.filter((item) => item !== undefined)
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
            contains_nan_values: false,
            column_used_as_index: '',
            methylations: [],
            mirnas: [],
            cnas: [],
            mrnas: []
        }
    }

    /**
     * Edits a biomarker
     * @param biomarker Biomarker to edit
     */
    editBiomarker = (biomarker: Biomarker) => {
        const biomarkerCopy = copyObject(biomarker)
        this.setState({ newBiomarker: biomarkerCopy })
    }

    /**
     * When the component has been mounted, It requests for
     * tags and files
     */
    componentDidMount () {
        this.getUserTags()
    }

    /**
     * Selects a new Biomarker to edit
     * @param selectedBiomarker Biomarker to edit
     */
    editTag = (selectedBiomarker: Biomarker) => {
        this.setState({ newBiomarker: copyObject(selectedBiomarker) })
    }

    /**
     * Cleans the new/edit biomarker form
     */
    cleanForm = () => { this.setState({ isOpenModal: true, formBiomarker: this.getDefaultFormBiomarker(), confirmModal: this.getDefaultConfirmModal() }) }

    /**
     * Does a request to add a new Biomarker
     */
    addOrEditBiomarker = () => {
        if (!this.canAddBiomarker()) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // If exists an id then we are editing, otherwise It's a new Tag
        let addOrEditURL, requestMethod
        if (this.state.newBiomarker.id) {
            addOrEditURL = `${urlBiomarkersCRUD}/${this.state.newBiomarker.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlBiomarkersCRUD
            requestMethod = ky.post
        }

        this.setState({ addingOrEditingBiomarker: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newBiomarker }).then((response) => {
                response.json().then((biomarker: Biomarker) => {
                    if (biomarker && biomarker.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.cleanForm()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                console.log('Error adding new Biomarker ->', err)
            }).finally(() => {
                this.setState({ addingOrEditingBiomarker: false })
            })
        })
    }

    /**
     * Makes a request to delete a Tag
     */
    deleteBiomarker = () => {
        // Sets the Request's Headers
        if (this.state.selectedBiomarkerToDeleteOrSync === null) {
            return
        }

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkersCRUD}/${this.state.selectedBiomarkerToDeleteOrSync.id}`
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
            this.addOrEditBiomarker()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newBiomarker: this.getDefaultNewBiomarker() })
            }
        }
    }

    /**
     * Show a modal to confirm a Biomarker deletion
     * @param biomarker Selected Biomarker to delete
     */
    confirmBiomarkerDeletion = (biomarker: Biomarker) => {
        this.setState<never>({
            selectedBiomarkerToDeleteOrSync: biomarker,
            showDeleteBiomarkerModal: true
        })
    }

    /**
     * Closes the deletion confirm modals
     */
    handleClose = () => {
        this.setState({ showDeleteBiomarkerModal: false })
    }

    /**
     * Check if can submit the new Biomarker form
     * @returns True if everything is OK, false otherwise
     */
    canAddBiomarker = (): boolean => {
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
        this.setState({ newBiomarker: newBiomarker })
    }

    /**
     * TODO: Check if needed
     * Handles CGDS Dataset form changes
     * @param datasetName Name of the edited CGDS dataset
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleFormDatasetChanges = (datasetName: NameOfCGDSDataset, name: string, value: any) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null) {
            dataset[name] = value
            this.setState({ newBiomarker: newBiomarker })
        }
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
            this.setState({ newBiomarker: newBiomarker })
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
            this.setState({ newBiomarker: newBiomarker })
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
            this.setState({ newBiomarker: newBiomarker })
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
    isFormEmpty = (): boolean => _.isEqual(this.state.formBiomarker, this.getDefaultFormBiomarker())

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<Biomarker>[] {
        return [
            { name: 'Name', serverCodeToSort: 'name', width: 3 },
            { name: 'Description', serverCodeToSort: 'description', width: 4 },
            { name: 'Tag', serverCodeToSort: 'tag', width: 2 },
            { name: 'Date', serverCodeToSort: 'upload_date' },
            { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
            { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
            { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
            { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 },
            { name: 'Actions' }
        ]
    }

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
     * Function to complete step 1
     * @param selectedBiomarker Biomarker selected to continue process
     */
    handleCompleteStep1 = (selectedBiomarker: Biomarker) => {
        const featureSelection = this.state.featureSelection
        featureSelection.biomarker = selectedBiomarker
        featureSelection.step = 2
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

        ky.get(urlTagsCRUD, { searchParams: searchParams }).then((response) => {
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
            isOpenModal: false,
            confirmModal: this.getDefaultConfirmModal(),
            biomarkerTypeSelected: BiomarkerTypeSelected.BASE
        })
    }

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()

        return (
            <Base activeItem='biomarkers' wrapperClass='wrapper'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                <PaginatedTable<Biomarker>
                    headerTitle='Biomarkers'
                    headers={this.getDefaultHeaders()}
                    customFilters={this.getDefaultFilters()}
                    showSearchInput
                    customElements={[
                        <Form.Field key={1} className='biomarkers--button--modal' title='Add new Biomarker'>
                            <Button primary icon onClick={() => this.setState({ formBiomarker: this.getDefaultFormBiomarker(), isOpenModal: true })}>
                                <Icon name='add' />
                            </Button>
                        </Form.Field>
                    ]}
                    searchLabel='Name'
                    searchPlaceholder='Search by name'
                    urlToRetrieveData={urlBiomarkersCRUD}
                    updateWSKey='update_biomarkers'
                    mapFunction={(biomarker: Biomarker) => (
                        <Table.Row key={biomarker.id as number}>
                            <TableCellWithTitle value={biomarker.name} />
                            <TableCellWithTitle value={biomarker.description} />
                            <Table.Cell><TagLabel tag={biomarker.tag} /> </Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'LLL')} />
                            <Table.Cell>{biomarker.number_of_mrnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_mirnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_cnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_methylations}</Table.Cell>
                            <Table.Cell>
                                {/* Users can modify or delete own biomarkers or the ones which the user is admin of */}
                                <React.Fragment>

                                    {/* Shows a delete button if specified */}
                                    <Icon
                                        name='pencil'
                                        className='clickable margin-left-5'
                                        color='yellow'
                                        title='Edit biomarker'
                                        onClick={() => this.handleOpenEditBiomarker(biomarker)}
                                    />
                                    <Icon
                                        name='trash'
                                        className='clickable margin-left-5'
                                        color='red'
                                        title='Delete biomarker'
                                        onClick={() => this.confirmBiomarkerDeletion(biomarker)}
                                    />
                                </React.Fragment>
                            </Table.Cell>
                        </Table.Row>
                    )}
                />

                <Modal
                    closeIcon={<Icon name='close' size='large' />}
                    closeOnEscape={false}
                    closeOnDimmerClick={false}
                    closeOnDocumentClick={false}
                    style={this.state.biomarkerTypeSelected === BiomarkerTypeSelected.BASE ? { width: '60%', minHeight: '60%' } : { width: '92%', minHeight: '92%' }}
                    onClose={() => this.state.biomarkerTypeSelected !== BiomarkerTypeSelected.BASE ? this.handleChangeConfirmModalState(true, 'You are going to lose all the data inserted', 'Are you sure?', this.closeBiomarkerModal) : this.closeBiomarkerModal()}
                    open={this.state.isOpenModal}>
                    {
                        this.state.biomarkerTypeSelected === BiomarkerTypeSelected.BASE &&
                        <BiomarkerTypeSelection handleSelectModal={this.handleSelectModal} />
                    }
                    {
                        this.state.biomarkerTypeSelected === BiomarkerTypeSelected.MANUAL &&
                        <ManualForm
                            handleChangeInputForm={this.handleChangeInputForm}
                            handleChangeMoleculeInputSelected={this.handleChangeMoleculeInputSelected}
                            handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                            biomarkerForm={this.state.formBiomarker}
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
                            handleSendForm={this.createBiomarker}
                            handleChangeCheckBox={this.handleChangeCheckBox}
                        />
                    }
                    {
                        this.state.biomarkerTypeSelected === BiomarkerTypeSelected.FEATURE_SELECTION &&
                        <FeatureSelectionPanel
                            featureSelection={this.state.featureSelection}
                            getDefaultFilters={this.getDefaultFilters()}
                            urlBiomarkersCRUD={urlBiomarkersCRUD}
                            markBiomarkerAsSelected={this.markBiomarkerAsSelected}
                            handleCompleteStep1={this.handleCompleteStep1}
                            handleCompleteStep2={this.handleCompleteStep2}
                            selectNewFile={this.selectNewFile}
                            selectStudy={this.selectStudy}
                            selectUploadedFile={this.selectUploadedFile}
                            handleChangeSourceType={this.handleChangeSourceType}
                        />
                    }
                </Modal>

                <Confirm
                    className='biomarkers--confirm--modal'
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    size="large"
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => this.state.confirmModal.onConfirm()} />

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

export { Biomarker }
