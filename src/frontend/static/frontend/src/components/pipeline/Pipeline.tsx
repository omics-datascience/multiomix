import React from 'react'
import { MiRNAPipeline } from './MiRNAPipeline'
import { Base } from '../Base'
import { WebsocketConfig, FileType, Source, SourceType, ResponseRequestWithPagination, AllExperimentsTableControl, AllExperimentsSortField, NewExperiment, Nullable, KySearchParams, ConfirmModal } from '../../utils/interfaces'
import { getDjangoHeader, alertGeneralError, getDefaultNewTag, getDefaultSource, getInputFileCSVColumns, getFilenameFromSource, cleanRef, generatesOrderingQuery, getFileSizeInMB, makeSourceAndAppend } from '../../utils/util_functions'
import ky from 'ky'
import { DjangoResponseCode, DjangoCommonResponse, DjangoExperiment, ExperimentType, DjangoUserFile, DjangoCGDSStudy, CorrelationMethod, DjangoTag, TagType, DjangoNumberSamplesInCommonResult, DjangoNumberSamplesInCommonOneFrontResult, PValuesAdjustmentMethod, DjangoUserFileUploadErrorInternalCode } from '../../utils/django_interfaces'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import isEqual from 'lodash/isEqual'
import intersection from 'lodash/intersection'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { MAX_FILE_SIZE_IN_MB_WARN } from '../../utils/constants'
import { Confirm } from 'semantic-ui-react'

type NumberOfSamplesFields = 'numberOfSamplesMRNA' | 'numberOfSamplesGEM'
type NewExperimentSourceStateName = 'mRNASource' | 'gemSource'

// Constants declared in gem.html
declare const urlRunExperiment: string
declare const currentUserId: string
declare const urlLastExperiments: string
declare const urlUserExperiments: string
declare const urlTagsCRUD: string
declare const urlGetCommonSamples: string
declare const urlGetCommonSamplesOneFront: string

/**
 * AllExperiments Request structure.
 * Type, tag and cor. method are optional as they are filter options
 */
type AllExperimentRequestSearchParam = {
    /** Page Number */
    page: number,
    /** Page Size */
    page_size: number,
    /** Search String */
    search?: string,
    /** Field to sort */
    ordering?: string,
    /** Experiment type (value of ExperimentType enum) */
    type?: number,
    /** Id of tag */
    tag?: number,
    /** Cor. Method used (value of CorrelationMethod enum) */
    correlation_method?: number
}

/**
 * Component's state
 */
type PipelineState = {
    newExperiment: NewExperiment,
    gemFileType: FileType,
    uploadPercentage: number,
    tags: DjangoTag[],
    isSelectingTagForNewExperiment: boolean,
    newTagForNewExperiment: DjangoTag,
    addingTagForNewExperiment: boolean,
    numberOfSamplesMRNA: number,
    numberOfSamplesGEM: number,
    numberOfSamplesInCommon: number,
    sendingRequest: boolean,
    gettingExperiments: boolean,
    lastExperiments: DjangoExperiment[],
    /** File type to filter experiments for mRNA, miRNA, CNA or Methylation */
    selectedFileTypeForFilter: FileType,
    gettingCommonSamples: boolean,
    // All experiments table's fields
    allExperiments: DjangoExperiment[],
    allExperimentsTableControl: AllExperimentsTableControl,
    gettingAllExperiments: boolean,
    confirmModal: ConfirmModal,

};

/**
 * Main Pipeline class render. Renders a new experiment form
 * and modals to confirm some actions
 */
class Pipeline extends React.Component<{}, PipelineState> {
    websocketClient: WebsocketClientCustom
    filterTimeout: number | undefined
    defaultNewExperiment: NewExperiment
    abortController = new AbortController()

    constructor (props) {
        super(props)

        // This line is to prevent a lot of method calls when noDataEntered is executed
        this.defaultNewExperiment = this.getDefaultNewExperiment()

        this.initializeWebsocketClient()

        this.state = {
            newExperiment: this.getDefaultNewExperiment(),
            gemFileType: FileType.MIRNA,
            uploadPercentage: 0,
            tags: [],
            isSelectingTagForNewExperiment: false,
            newTagForNewExperiment: getDefaultNewTag(),
            addingTagForNewExperiment: false,
            numberOfSamplesMRNA: 0,
            numberOfSamplesGEM: 0,
            numberOfSamplesInCommon: 0,
            sendingRequest: false,
            lastExperiments: [],
            gettingExperiments: false,
            gettingCommonSamples: false,
            selectedFileTypeForFilter: FileType.ALL,
            allExperiments: [],
            allExperimentsTableControl: this.getDefaultAllExperimentsTableControl(),
            gettingAllExperiments: false,
            confirmModal: this.getDefaultConfirmModal()
        }
    }
    /**
     * Abort controller if component unmount
     */

    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Handle form's inputs changes
     * @param name Field to change
     * @param value New value to change the field
     */
    handleFormInputsChange = (name: string, value) => {
        const newExperiment = this.state.newExperiment
        newExperiment[name] = value

        // TODO: remove this after Kendall performance issue is solved
        if (name === 'correlationMethod' && value === CorrelationMethod.KENDALL) {
            newExperiment.correlateWithAllGenes = false
        }

        this.setState({ newExperiment })
    }

    /**
     * Check if a Source is hosted in the backend
     * @param source Source to check
     * @returns True if the Source is hosted in the backend. False otherwise
     */
    isDatasetInBackend (source: Source): boolean {
        return source.type === SourceType.UPLOADED_DATASETS || source.type === SourceType.CGDS
    }

    /**
     * Resets all the number of samples
     */
    resetAllNumberOfSamples = () => {
        this.setState({
            numberOfSamplesMRNA: 0,
            numberOfSamplesGEM: 0,
            numberOfSamplesInCommon: 0
        })
    }

    /**
     * Checks if there are common samples between two selected sources
     * to show in the new experiment form
     */
    checkCommonSamples () {
        // funcion que me ayuda
        const newExperiment = this.state.newExperiment

        // It needs both sources!
        if (newExperiment.mRNASource.type === SourceType.NONE || newExperiment.gemSource.type === SourceType.NONE) {
            this.resetAllNumberOfSamples()
            return
        }

        const mRNASourceIsInBackend = this.isDatasetInBackend(newExperiment.mRNASource)
        const gemSourceIsInBackend = this.isDatasetInBackend(newExperiment.gemSource)

        // If both datasets are hosted in backend, checks in server
        if (mRNASourceIsInBackend && gemSourceIsInBackend) {
            this.checkCommonSamplesInBackend()
        } else {
            // If one is in the frontend and other is in backend, reads the file columns
            // and sends them to server to check with the dataset hosted there
            if (mRNASourceIsInBackend || gemSourceIsInBackend) {
                this.checkCommonSamplesOneFrontOneBack(mRNASourceIsInBackend)
            } else {
                this.checkCommonSamplesInFrontend()
            }
        }
    }

    /**
     * Gets the id of the source hosted in backend to send to the service
     * of number of samples in common
     * @param source Source to get its id
     * @returns Id of the source or null if it's not been selected yet
     */
    getIdInBackend (source: Source): Nullable<number> {
        if (source.type === SourceType.UPLOADED_DATASETS && source.selectedExistingFile !== null) {
            return source.selectedExistingFile.id ?? null
        }

        if (source.type === SourceType.CGDS && source.CGDSStudy !== null) {
            return source.CGDSStudy.id ?? null
        }

        return null
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * hosted in backend
     */
    checkCommonSamplesInBackend () {
        const mRNASource = this.state.newExperiment.mRNASource
        const gemSource = this.state.newExperiment.gemSource

        const mRNASourceId = this.getIdInBackend(mRNASource)
        const gemSourceId = this.getIdInBackend(gemSource)

        if (mRNASourceId !== null && gemSourceId !== null) {
            const searchParams = {
                mRNASourceId,
                mRNASourceType: mRNASource.type,
                gemSourceId,
                gemSourceType: gemSource.type,
                gemFileType: this.state.gemFileType
            }

            this.setState({ gettingCommonSamples: true }, () => {
                ky.get(urlGetCommonSamples, { signal: this.abortController.signal, searchParams: searchParams as KySearchParams }).then((response) => {
                    this.setState({ gettingCommonSamples: false })
                    response.json().then((jsonResponse: DjangoNumberSamplesInCommonResult) => {
                        if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                            this.setState({
                                numberOfSamplesMRNA: jsonResponse.data.number_samples_mrna,
                                numberOfSamplesGEM: jsonResponse.data.number_samples_gem,
                                numberOfSamplesInCommon: jsonResponse.data.number_samples_in_common
                            })
                        }
                    }).catch((err) => {
                        console.log('Error parsing JSON ->', err)
                    })
                }).catch((err) => {
                    if (!this.abortController.signal.aborted) {
                        this.setState({ gettingCommonSamples: false })
                    }

                    console.log('Error getting user experiments', err)
                })
            })
        }
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * one in frontend, other in backend
     * @param mRNASourceIsInBackend Flag to know which dataset is in frontend and backend
     */
    checkCommonSamplesOneFrontOneBack (mRNASourceIsInBackend: boolean) {
        let sourceInFront: Source
        let sourceFrontNumberOfSampleName: NumberOfSamplesFields, sourceBackNumberOfSampleName: NumberOfSamplesFields
        let otherSourceId: number, otherSourceType: Nullable<SourceType>
        const mRNASource = this.state.newExperiment.mRNASource
        const gemSource = this.state.newExperiment.gemSource

        if (mRNASourceIsInBackend) {
            // If mRNA is in backend, GEM is in frontend
            const idInBackend = this.getIdInBackend(mRNASource)

            if (idInBackend === null) {
                return
            }

            sourceInFront = gemSource
            sourceFrontNumberOfSampleName = 'numberOfSamplesGEM'
            sourceBackNumberOfSampleName = 'numberOfSamplesMRNA'
            otherSourceId = idInBackend
            otherSourceType = mRNASource.type
        } else {
            const idInBackend = this.getIdInBackend(gemSource)

            if (idInBackend === null) {
                return
            }

            sourceInFront = mRNASource
            sourceFrontNumberOfSampleName = 'numberOfSamplesMRNA'
            sourceBackNumberOfSampleName = 'numberOfSamplesGEM'
            otherSourceId = idInBackend
            otherSourceType = gemSource.type
        }

        // We need both datasets!
        const sourceCurrentRef = sourceInFront.newUploadedFileRef.current

        if (!sourceCurrentRef || sourceCurrentRef.files.length === 0) {
            this.resetAllNumberOfSamples()
            return
        }

        const fileSizeInMB = getFileSizeInMB(sourceInFront.newUploadedFileRef.current.files[0].size)

        if (fileSizeInMB < MAX_FILE_SIZE_IN_MB_WARN) {
            const file = sourceInFront.newUploadedFileRef.current.files[0]
            getInputFileCSVColumns(file).then((headersColumnsNames) => {
                // Sets the Request's Headers
                const myHeaders = getDjangoHeader()

                // Sends an array of headers to compare in server
                const jsonData = {
                    headersColumnsNames,
                    otherSourceId,
                    otherSourceType
                }

                this.setState({ gettingCommonSamples: true }, () => {
                    ky.post(urlGetCommonSamplesOneFront, { json: jsonData, headers: myHeaders }).then((response) => {
                        this.setState({ gettingCommonSamples: false })
                        response.json().then((jsonResponse: DjangoNumberSamplesInCommonOneFrontResult) => {
                            if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                                // For front Source subtracts 1 to not have in count the first column of the file
                                this.setState<never>({
                                    [sourceFrontNumberOfSampleName]: Math.max(headersColumnsNames.length - 1, 0),
                                    [sourceBackNumberOfSampleName]: jsonResponse.data.number_samples_backend,
                                    numberOfSamplesInCommon: jsonResponse.data.number_samples_in_common
                                })
                            }
                        }).catch((err) => {
                            console.log('Error parsing JSON ->', err)
                        })
                    }).catch((err) => {
                        this.setState({ gettingCommonSamples: false })
                        console.log('Error getting user experiments', err)
                    })
                })
            }).catch(this.errorReadingFileInInput)
        }
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
     * Reset the confirm modal, to be used again
     */
    handleCancelConfirmModalState () {
        this.setState({ confirmModal: this.getDefaultConfirmModal() })
    }

    /**
     * Default modal.
     * @returns {ConfirmModal}
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
     * General method to avoid duplicated code when the reading
     * of a loaded user's file fails
     * @param event Event of error
     */
    errorReadingFileInInput = (event) => {
        this.resetAllNumberOfSamples()
        console.log('Error reading user\'s file')
        console.log(event.target.error.name)
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * loaded in HTML file inputs
     */
    checkCommonSamplesInFrontend () {
        const mRNASource = this.state.newExperiment.mRNASource
        const gemSource = this.state.newExperiment.gemSource

        // We need both datasets!
        if (mRNASource.newUploadedFileRef.current.files.length === 0 ||
            gemSource.newUploadedFileRef.current.files.length === 0) {
            this.resetAllNumberOfSamples()
            return
        }

        // Reads first file
        const mRNAFile = mRNASource.newUploadedFileRef.current.files[0]
        getInputFileCSVColumns(mRNAFile).then((mRNAHeadersColumnsNames) => {
            // Reads second file
            const gemFile = gemSource.newUploadedFileRef.current.files[0]
            getInputFileCSVColumns(gemFile).then((gemHeadersColumnsNames) => {
                // Gets length of sources and their intersection
                // For mRNA and GEM removes first element to not have in count the first column of the file (the index)
                mRNAHeadersColumnsNames.shift()
                gemHeadersColumnsNames.shift()

                this.setState({
                    numberOfSamplesMRNA: mRNAHeadersColumnsNames.length,
                    numberOfSamplesGEM: gemHeadersColumnsNames.length,
                    numberOfSamplesInCommon: intersection(
                        mRNAHeadersColumnsNames,
                        gemHeadersColumnsNames
                    ).length
                })
            }).catch(this.errorReadingFileInInput)
        }).catch(this.errorReadingFileInInput)
    }

    /**
     * When the component has been mounted gets the user experiments
     */
    componentDidMount () {
        this.updateAllExperimentsTables()
        this.getUserExperimentsTags()
    }

    /**
     * Updates all experiments tables: for the moment
     * the last experiments table and all experiments table
     */
    updateAllExperimentsTables = () => {
        this.getAllUserExperiments()
        this.getLastUserExperiments()
    }

    /**
     * Instantiates a Websocket Client
     */
    initializeWebsocketClient () {
        const websocketConfig: WebsocketConfig = {
            channelUrl: `/ws/users/${currentUserId}/`,
            commandsToAttend: [
                {
                    key: 'update_experiments',
                    functionToExecute: this.updateAllExperimentsTables
                }
            ]
        }
        this.websocketClient = new WebsocketClientCustom(websocketConfig)
    }

    /**
     * Fetches the logged user's experiments with pagination
     * @param retryIfNotFound If true, it retries when receive a 404 error (maybe it's the wrong page after removing)
     */
    getAllUserExperiments = (retryIfNotFound: boolean = true) => {
        // For short...
        const allExperimentsTableControl = this.state.allExperimentsTableControl

        const searchParams: AllExperimentRequestSearchParam = {
            page: allExperimentsTableControl.pageNumber,
            page_size: allExperimentsTableControl.pageSize,
            search: allExperimentsTableControl.textFilter
        }

        const ordering = generatesOrderingQuery(
            allExperimentsTableControl.sortField,
            allExperimentsTableControl.sortOrderAscendant
        )

        if (ordering !== null) {
            searchParams.ordering = ordering
        }

        // Adds filter params (if applicable)
        // If a Experiment type was selected, adds the filter
        if (allExperimentsTableControl.experimentType !== ExperimentType.ALL) {
            searchParams.type = allExperimentsTableControl.experimentType.valueOf()
        }

        // If a tag was selected, adds the filter
        if (allExperimentsTableControl.tagId) {
            searchParams.tag = allExperimentsTableControl.tagId
        }

        // If a Experiment type was selected, adds the filter
        if (allExperimentsTableControl.correlationMethod !== CorrelationMethod.ALL) {
            searchParams.correlation_method = allExperimentsTableControl.correlationMethod.valueOf()
        }

        this.setState({ gettingAllExperiments: true }, () => {
            ky.get(urlUserExperiments, { signal: this.abortController.signal, searchParams: searchParams as KySearchParams }).then((response) => {
                this.setState({ gettingAllExperiments: false })
                response.json().then((jsonResponse: ResponseRequestWithPagination<DjangoExperiment>) => {
                    allExperimentsTableControl.totalRowCount = jsonResponse.count
                    this.setState({ allExperiments: jsonResponse.results, allExperimentsTableControl })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ gettingAllExperiments: false })
                }

                // If it's a 404 error, maybe it's getting the wrong page after removing an Experiment
                // For ex. removes the unique Experiment in the third page, request that page after removing
                // will return a 404 error si we need to return a page before
                if (err.response.status === 404) {
                    if (retryIfNotFound && allExperimentsTableControl.pageNumber > 1) {
                        allExperimentsTableControl.pageNumber = allExperimentsTableControl.pageNumber - 1
                        this.setState({ allExperimentsTableControl }, () => this.getAllUserExperiments(false))
                    }
                } else {
                    console.log('Error getting user experiments', err)
                }
            })
        })
    }

    /**
     * Handles sorting on table of all experiments
     * @param headerServerCodeToSort Server code of the selected column to send to the server for sorting
     */
    handleSortAllExperiments = (headerServerCodeToSort: AllExperimentsSortField) => {
        // If the user has selected other column for sorting...
        const tableControl = this.state.allExperimentsTableControl

        if (this.state.allExperimentsTableControl.sortField !== headerServerCodeToSort) {
            tableControl.sortField = headerServerCodeToSort
            tableControl.sortOrderAscendant = true
        } else {
            // If it's the same just change the sort order
            tableControl.sortOrderAscendant = !tableControl.sortOrderAscendant
        }

        this.setState({ allExperimentsTableControl: tableControl }, this.getAllUserExperiments)
    }

    /**
     * Handles the all experiments table's control filters, select, etc changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     */
    handleTableControlChangesAllExperiments = (name: string, value: any, resetPagination: boolean = true) => {
        // Updates filter information and makes the request again
        const tableControl = this.state.allExperimentsTableControl
        tableControl[name] = value

        // If pagination reset is required...
        if (resetPagination) {
            tableControl.pageNumber = 1
        }

        // Sets the new state and gets new experiment info
        this.setState({ allExperimentsTableControl: tableControl }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout(this.getAllUserExperiments, 300)
        })
    }

    /**
     * Fetches the logged user's experiments
     */
    getLastUserExperiments = () => {
        this.setState({ gettingExperiments: true }, () => {
            ky.get(urlLastExperiments, { signal: this.abortController.signal }).then((response) => {
                this.setState({ gettingExperiments: false })

                response.json().then((experiments: DjangoExperiment[]) => {
                    this.setState({ lastExperiments: experiments })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ gettingExperiments: false })
                }

                console.log('Error getting user experiments', err)
            })
        })
    }

    /**
     * Generates a default NewExperiment
     * @returns New experiment default fields
     */
    getDefaultNewExperiment (): NewExperiment {
        return {
            name: '',
            description: '',
            correlationCoefficient: 0.7,
            standardDeviationGene: 0.0,
            standardDeviationGEM: 0.2,
            correlationMethod: CorrelationMethod.PEARSON,
            adjustmentMethod: PValuesAdjustmentMethod.BENJAMINI_HOCHBERG,
            mRNASource: getDefaultSource(),
            gemSource: getDefaultSource(),
            tag: getDefaultNewTag(),
            correlateWithAllGenes: false
        }
    }

    /**
     * Generates a default AllExperimentsTableControl state
     * NOTE: by default sorts by submit date descendant
     * @returns New default TableControl state
     */
    getDefaultAllExperimentsTableControl (): AllExperimentsTableControl {
        return {
            pageNumber: 1,
            pageSize: 10,
            sortField: 'submit_date',
            sortOrderAscendant: false,
            textFilter: '',
            totalRowCount: 0,
            experimentType: ExperimentType.ALL,
            tagId: null,
            correlationMethod: CorrelationMethod.ALL,
            filters: {}
        }
    }

    /**
     * Sets the default GEM standard deviation filter value to the new experiment
     * @param experiment New Experiment to set the default GEM standard deviation filter value
     */
    setDefaultGEMStd = (experiment: NewExperiment) => {
        // FIXME: set to 0 when Slider library is fixed
        if (this.state.gemFileType === FileType.CNA) {
            experiment.standardDeviationGEM = 0.0001
        } else {
            experiment.standardDeviationGEM = this.getDefaultNewExperiment().standardDeviationGEM
        }
    }

    /**
     * Resets the new experiment form
     */
    resetExperimentForm = () => {
        // Cleans the references for uncontrolled file inputs
        cleanRef(this.state.newExperiment.mRNASource.newUploadedFileRef)
        cleanRef(this.state.newExperiment.gemSource.newUploadedFileRef)

        const newExperiment = this.getDefaultNewExperiment()
        this.setDefaultGEMStd(newExperiment)

        // Cleans the rest of the fields
        this.setState({ newExperiment }, () => {
            // Cleans the number of samples
            this.resetAllNumberOfSamples()

            this.updateSourceFilenames()
        })
    }

    /**
     * Resets only GEM Source's state
     */
    resetGEMSource = () => {
        const newExperiment = this.state.newExperiment
        cleanRef(newExperiment.gemSource.newUploadedFileRef)
        newExperiment.gemSource = getDefaultSource()

        // If CNA is selected we need to adjust the Std filter
        this.setDefaultGEMStd(newExperiment)

        // Resets correlate only matching genes or all vs all
        newExperiment.correlateWithAllGenes = false

        // CNA analysis use Kendall by default
        if (this.state.gemFileType === FileType.CNA) {
            newExperiment.correlationMethod = CorrelationMethod.KENDALL
        } else {
            newExperiment.correlationMethod = CorrelationMethod.PEARSON
        }

        this.setState({ newExperiment }, this.updateSourceFilenames)
    }

    /**
     * Run the specified pipeline
     */
    runPipeline = () => {
        // Generates the FormData
        const formData = new FormData()

        // For short...
        const newExperiment = this.state.newExperiment

        // Appends name, description and FileType
        formData.append('name', newExperiment.name)
        formData.append('description', newExperiment.description)
        formData.append('fileType', this.state.gemFileType.toString())

        // Appends selected Tag's id (if entered)
        if (newExperiment.tag && newExperiment.tag.id) {
            formData.append('tagId', newExperiment.tag.id.toString())
        }

        // Appends the correlation threshold and other parameters
        formData.append('coefficientThreshold', newExperiment.correlationCoefficient.toString())
        formData.append('standardDeviationGene', newExperiment.standardDeviationGene.toString())
        formData.append('standardDeviationGEM', newExperiment.standardDeviationGEM.toString())
        formData.append('correlationMethod', newExperiment.correlationMethod.toString())
        formData.append('adjustmentMethod', newExperiment.adjustmentMethod.toString())

        // Appends the source type, and the file content depending of it (pk if selecting
        // an existing file, Blob content if uploading a new file, etc)
        makeSourceAndAppend(newExperiment.mRNASource, formData, 'mRNA')
        makeSourceAndAppend(newExperiment.gemSource, formData, 'gem')

        // Methylation only fields
        if (this.state.gemFileType !== FileType.MIRNA) {
            formData.append('correlateWithAllGenes', newExperiment.correlateWithAllGenes.toString())
        }

        // Makes the request
        const myHeaders = getDjangoHeader()

        // For Axios compatibility
        const axiosHeaders = {}
        myHeaders.forEach((value: string, key: string) => {
            axiosHeaders[key] = value
        })

        axiosHeaders['content-type'] = 'multipart/form-data'

        const config: AxiosRequestConfig = {
            headers: axiosHeaders,
            onUploadProgress: (progressEvent) => {
                const total = progressEvent.total as number
                const percentCompleted = Math.round((progressEvent.loaded * 100) / total)
                this.setState({ uploadPercentage: percentCompleted })
            }
        }

        this.setState({ sendingRequest: true }, () => {
            axios.post(urlRunExperiment, formData, config)
                .then((response: AxiosResponse<DjangoCommonResponse<DjangoUserFileUploadErrorInternalCode>>) => {
                    const responseJSON = response.data

                    // If everything gone OK, resets the form and refresh the experiments
                    if (responseJSON.status.code === DjangoResponseCode.SUCCESS) {
                        this.resetExperimentForm()
                        this.resetAllNumberOfSamples()
                    } else {
                        if (responseJSON.status.internal_code === DjangoUserFileUploadErrorInternalCode.INVALID_FORMAT_NON_NUMERIC) {
                            alert('The file has an incorrect format: all columns except the index must be numerical data')
                        } else {
                            alertGeneralError()
                        }
                    }
                }).catch((error) => {
                    alertGeneralError()
                    console.log('Error submitting files', error)
                }).finally(() => {
                    this.setState({ sendingRequest: false })
                })
        })
    }

    /**
     * Copy a selected Experiment to load its field in the form to edit it
     * @param experiment Selected experiment to edit
     */
    editExperiment = (experiment: DjangoExperiment) => {
        const newExperiment = this.getDefaultNewExperiment()

        // Escape null fields to prevent React errors
        newExperiment.id = experiment.id // This will be the 'editing' flag!
        newExperiment.name = experiment.name
        newExperiment.description = experiment.description ? experiment.description : ''
        newExperiment.tag = experiment.tag ? experiment.tag : getDefaultNewTag()

        this.setState({ newExperiment })
    }

    /**
     * Make a request to edit a specific experiment
     */
    makeEditExperimentRequest = () => {
        const newExperiment = this.state.newExperiment
        const jsonData = {
            name: newExperiment.name,
            description: newExperiment.description,
            tag: newExperiment.tag.id
        }

        // Makes the request
        const myHeaders = getDjangoHeader()
        const url = `${urlUserExperiments}/${newExperiment.id}/`

        this.setState({ sendingRequest: true }, () => {
            ky.patch(url, { headers: myHeaders, json: jsonData }).then(() => {
                this.setState({ sendingRequest: false })
                this.resetExperimentForm()
            }).catch((err) => {
                this.setState({ sendingRequest: false })
                alertGeneralError()
                console.log('Error submitting files', err)
            })
        })
    }

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    handleChangeSourceType = (sourceType: SourceType, sourceStateName: NewExperimentSourceStateName) => {
        // Selects source to update
        const newExperiment = this.state.newExperiment
        const source = (sourceStateName === 'mRNASource')
            ? newExperiment.mRNASource
            : newExperiment.gemSource

        // Change source type
        source.type = sourceType

        // Resets all source values
        source.selectedExistingFile = null
        source.CGDSStudy = null
        cleanRef(source.newUploadedFileRef)

        // After update state
        this.setState({ newExperiment }, this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    updateSourceFilenames = () => {
        // Updates state filenames
        const newExperiment = this.state.newExperiment

        newExperiment.mRNASource.filename = getFilenameFromSource(newExperiment.mRNASource)
        newExperiment.gemSource.filename = getFilenameFromSource(newExperiment.gemSource)

        this.setState({ newExperiment })
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    selectNewFile = () => { this.updateSourceFilenamesAndCommonSamples() }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: NewExperimentSourceStateName) => {
        const newExperiment = this.state.newExperiment
        const source = (sourceStateName === 'mRNASource')
            ? newExperiment.mRNASource
            : newExperiment.gemSource

        source.type = SourceType.UPLOADED_DATASETS
        source.selectedExistingFile = selectedFile
        this.setState({ newExperiment }, this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Checks if user has entered data in the form
     * @returns True if the new experiment is equal to a default new experiment. False otherwise
     */
    noDataEntered = (): boolean => isEqual(this.state.newExperiment, this.defaultNewExperiment)

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: NewExperimentSourceStateName) => {
        const newExperiment = this.state.newExperiment
        const source = (sourceStateName === 'mRNASource')
            ? newExperiment.mRNASource
            : newExperiment.gemSource

        source.type = SourceType.CGDS
        source.CGDSStudy = selectedStudy
        this.setState({ newExperiment }, this.updateSourceFilenamesAndCommonSamples)
    }

    /**
     * Updates Sources' filenames and common examples counter
     */
    updateSourceFilenamesAndCommonSamples = () => {
        this.updateSourceFilenames()
        this.checkCommonSamples()
    }

    /**
     * Selects a new FileType to select
     * @param fileType Selected FileType to set to the state
     */
    selectGEMFileType = (fileType: FileType) => {
        this.setState({ gemFileType: fileType }, this.resetGEMSource)
    }

    /**
     * Fetches the User's defined tags
     * @param functionToExecute Function to execute after updating state
     */
    getUserExperimentsTags = (functionToExecute?: () => void) => {
        // Gets only Experiment's Tags
        const searchParams = {
            type: TagType.EXPERIMENT
        }

        ky.get(urlTagsCRUD, { signal: this.abortController.signal, searchParams }).then((response) => {
            response.json().then((experimentTags: DjangoTag[]) => {
                this.setState({ tags: experimentTags }, functionToExecute)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's experiment's tags ->", err)
        })
    }

    /**
     * Toggles the Tag form to select or add a tag to a new experiment
     */
    toggleDisplayTagForm = () => { this.setState((prev) => ({ isSelectingTagForNewExperiment: !prev.isSelectingTagForNewExperiment })) }

    /**
     * Selects a tag to set to an experiment from the NewExperiment form
     * @param selectedTagId Selected tag's id to set to the experiment
     */
    selectTagForNewExperiment = (selectedTagId: Nullable<number>) => {
        const newExperiment = this.state.newExperiment

        // Gets the selected Tag object
        const selectedTag = this.state.tags.find((tag) => tag.id === selectedTagId)
        newExperiment.tag = selectedTag ?? getDefaultNewTag()

        this.setState({ newExperiment, isSelectingTagForNewExperiment: false })
    }

    /**
     * Does a request to add a new Tag
     */
    addTagAndSelect () {
        if (this.state.addingTagForNewExperiment) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        this.setState({ addingTagForNewExperiment: true }, () => {
            ky.post(urlTagsCRUD, { headers: myHeaders, json: this.state.newTagForNewExperiment }).then((response) => {
                this.setState({ addingTagForNewExperiment: false })
                response.json().then((insertedTag: DjangoTag) => {
                    if (insertedTag && insertedTag.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list and select the tag
                        this.setState({ newTagForNewExperiment: getDefaultNewTag() })
                        this.getUserExperimentsTags(() => {
                            this.selectTagForNewExperiment(insertedTag.id)
                        })
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ addingTagForNewExperiment: false })
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            })
        })
    }

    /**
     * Handles New Tag Input Key Press
     * @param e Event of change
     */
    handleKeyDownForNewExperiment = (e) => {
        if (e.which === 13 || e.keyCode === 13) {
            this.addTagAndSelect()
        } else {
            // If pressed Escape cancel the form
            if (e.which === 27 || e.keyCode === 27) {
                this.selectTagForNewExperiment(null)
            }
        }
    }

    /**
     * Handles New Tag Input changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     */
    handleAddTagInputsChangeForNewExperiment = (name: string, value) => {
        const newTagForNewExperiment = this.state.newTagForNewExperiment
        newTagForNewExperiment[name] = value
        this.setState({ newTagForNewExperiment })
    }

    render () {
        return (
            <div style={{ height: '100%' }}>
                {/* Show GEM menu */}
                <Base activeItem='pipeline' wrapperClass='wrapper'>
                    <MiRNAPipeline
                        newExperiment={this.state.newExperiment}
                        gemFileType={this.state.gemFileType}
                        uploadPercentage={this.state.uploadPercentage}
                        tags={this.state.tags}
                        // For the tag form
                        isSelectingTagForNewExperiment={this.state.isSelectingTagForNewExperiment}
                        getAllUserExperiments={this.getAllUserExperiments}
                        toggleDisplayTagForm={this.toggleDisplayTagForm}
                        selectTagForNewExperiment={this.selectTagForNewExperiment}
                        gettingCommonSamples={this.state.gettingCommonSamples}
                        numberOfSamplesMRNA={this.state.numberOfSamplesMRNA}
                        numberOfSamplesMiRNA={this.state.numberOfSamplesGEM}
                        numberOfSamplesInCommon={this.state.numberOfSamplesInCommon}
                        newTagForNewExperiment={this.state.newTagForNewExperiment}
                        addingTagForNewExperiment={this.state.addingTagForNewExperiment}
                        handleKeyDownForNewExperiment={this.handleKeyDownForNewExperiment}
                        handleAddTagInputsChangeForNewExperiment={this.handleAddTagInputsChangeForNewExperiment}
                        // Rest of parameters
                        sendingRequest={this.state.sendingRequest}
                        lastExperiments={this.state.lastExperiments}
                        gettingExperiments={this.state.gettingExperiments}
                        getUserExperimentsTags={this.getUserExperimentsTags}
                        makeEditExperimentRequest={this.makeEditExperimentRequest}
                        runPipeline={this.runPipeline}
                        editExperiment={this.editExperiment}
                        resetExperimentForm={this.resetExperimentForm}
                        handleFormInputsChange={this.handleFormInputsChange}
                        noDataEntered={this.noDataEntered}
                        handleChangeSourceType={this.handleChangeSourceType}
                        selectNewFile={this.selectNewFile}
                        selectUploadedFile={this.selectUploadedFile}
                        selectStudy={this.selectStudy}
                        selectGEMFileType={this.selectGEMFileType}
                        // All experiment view
                        allExperiments={this.state.allExperiments}
                        allExperimentsTableControl={this.state.allExperimentsTableControl}
                        gettingAllExperiments={this.state.gettingAllExperiments}
                        handleSortAllExperiments={this.handleSortAllExperiments}
                        handleTableControlChangesAllExperiments={this.handleTableControlChangesAllExperiments}
                        updateAllExperimentsTables={this.updateAllExperimentsTables}
                        handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                    />
                </Base>
                <Confirm
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    size="large"
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => {
                        this.state.confirmModal.onConfirm()
                        const confirmModal = this.state.confirmModal
                        confirmModal.confirmModal = false
                        this.setState({ confirmModal })
                    }}
                />
            </div>
        )
    }
}

export { Pipeline, NewExperimentSourceStateName }
