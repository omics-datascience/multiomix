import React from 'react'
import { FileType, ExperimentStateInfo, GEMImageAndLabelInfo, CorrelationType, ExperimentResultTableControl, GeneralTableControl, Source, SourceType, HandleChangesCallback, Nullable, SortField, MirDIPScoreClass, ScoreClassData, BinData } from './interfaces'
import { DropdownItemProps, InputOnChangeData } from 'semantic-ui-react'
import { TagType, DjangoTag, ExperimentState, ExperimentType, CorrelationMethod, PValuesAdjustmentMethod, DjangoMRNAxGEMResultRow } from './django_interfaces'
import dayjs from 'dayjs'
import countBy from 'lodash/countBy'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { MAX_FILE_SIZE_IN_MB_ERROR } from './constants'

dayjs.extend(localizedFormat)

declare const CSRFToken: string

const DEFAULT_FILENAME = 'Choose File'

/**
 * Generates a HTTP Header with Django CSRF Token
 * @returns Header with  Django CSRF Token added
 */
const getDjangoHeader = (): Headers => {
    const headers = new Headers()
    headers.append('X-CSRFToken', CSRFToken)
    return headers
}

/**
 * Alerts a generic error message in screen
 */
const alertGeneralError = () => { alert('An error ocurred. Please, try again') }

/**
 * Generates an array with all the FileType options for Select
 * @param withOptionAll If true the resulting array includes the option 'All'
 * @returns An array with the options
 */
const getFileTypeSelectOptions = (withOptionAll: boolean = true): DropdownItemProps[] => {
    const fileTypeOptions = [
        { key: 'all', value: FileType.ALL, text: 'All' },
        { key: 'mrna', value: FileType.MRNA, text: 'mRNA' },
        { key: 'mirna', value: FileType.MIRNA, text: 'miRNA' },
        { key: 'cna', value: FileType.CNA, text: 'CNA' },
        { key: 'methylation', value: FileType.METHYLATION, text: 'Methylation' },
        { key: 'clinical', value: FileType.CLINICAL, text: 'Clinical' }
    ]

    if (withOptionAll) {
        return fileTypeOptions
    }

    // Returns all the options except the 'All' one
    return fileTypeOptions.slice(1)
}

/**
 * Generates an array with all the ExperimentType options for Select
 * @param withOptionAll If true the resulting array includes the option 'All'
 * @returns An array with the options
 */
const getExperimentTypeSelectOptions = (withOptionAll: boolean = true): DropdownItemProps[] => {
    const experimentTypeOptions = [
        { key: 'all', value: ExperimentType.ALL, text: 'All' },
        { key: 'mirna', value: ExperimentType.MIRNA, text: 'miRNA' },
        { key: 'cna', value: ExperimentType.CNA, text: 'CNA' },
        { key: 'methylation', value: ExperimentType.METHYLATION, text: 'Methylation' }
    ]

    if (withOptionAll) {
        return experimentTypeOptions
    }

    // Returns all the options except the 'All' one
    return experimentTypeOptions.slice(1)
}

/**
 * Generates an array with all the Correlation method options for Select
 * @param withOptionAll If true the resulting array includes the option 'All'
 * @returns An array with the options
 */
const getCorrelationMethodSelectOptions = (withOptionAll: boolean = true): DropdownItemProps[] => {
    const corMethodOptions = [
        { key: 'all', value: CorrelationMethod.ALL, text: 'All' },
        { key: 'pearson', text: 'Pearson', value: CorrelationMethod.PEARSON },
        { key: 'spearman', text: 'Spearman', value: CorrelationMethod.SPEARMAN },
        { key: 'kendall', text: 'Kendall', value: CorrelationMethod.KENDALL }
    ]

    if (withOptionAll) {
        return corMethodOptions
    }

    // Returns all the options except the 'All' one
    return corMethodOptions.slice(1)
}

/**
 * Generates an array with all the p-value adjustment method options for Select
 * @returns An array with the options
 */
const getAdjustmentMethodSelectOptions = (): DropdownItemProps[] => {
    return [
        { key: 'bh', text: 'Benjamini-Hochberg', value: PValuesAdjustmentMethod.BENJAMINI_HOCHBERG },
        { key: 'bonferroni', text: 'Bonferroni', value: PValuesAdjustmentMethod.BONFERRONI },
        { key: 'by', text: 'Benjamini-Yekutieli', value: PValuesAdjustmentMethod.BENJAMINI_YEKUTIELI }
    ]
}

/**
 * Gets a p-values adjustment method description
 * @param pValuesAdjustmentMethod P-values adjustment method to analyze
 * @returns P-values adjustment method description
 */
const getPValuesAdjustmentMethodDescription = (pValuesAdjustmentMethod: PValuesAdjustmentMethod): string => {
    switch (pValuesAdjustmentMethod) {
        case PValuesAdjustmentMethod.BENJAMINI_HOCHBERG:
            return 'Benjamini-Hochberg'
        case PValuesAdjustmentMethod.BENJAMINI_YEKUTIELI:
            return 'Benjamini-Yekutieli'
        case PValuesAdjustmentMethod.BONFERRONI:
            return 'Bonferroni'
    }
}

/**
 * Generates a default New Tag
 * @returns New tag with all the fields empty
 */
const getDefaultNewTag = (): DjangoTag => {
    return {
        id: null,
        name: '',
        description: '',
        parent_tag: null,
        type: TagType.FILE
    }
}

/**
 * Parse a value to use it in an input. React does not accept null values,
 * that's why this function is used
 * @param value Value to parse
 * @returns The value in case it !== null. '' otherwise
 */
const parseValue = (value: any | null): string => {
    return value !== null ? value : ''
}

/**
 * Makes a copy of an object.
 * TODO: check if it can be replaced by structuredClone.
 * @param anObject Object to copy
 * @returns Copy of the param object
 */
const copyObject = <T>(anObject: T): T => {
    return Object.assign({}, anObject)
}

/**
 * Gets info about the state to display in the card
 * @param state Experiment state
 * @returns The corresponding info of the current experiment's state
 */
const getStateObj = (state: ExperimentState): ExperimentStateInfo => {
    let stateIcon: ExperimentStateInfo
    switch (state) {
        case ExperimentState.COMPLETED:
            stateIcon = {
                iconName: 'check',
                color: 'green',
                loading: false,
                title: 'The experiment is complete'
            }
            break
        case ExperimentState.FINISHED_WITH_ERROR:
            stateIcon = {
                iconName: 'times',
                color: 'red',
                loading: false,
                title: 'The analysis has finished with errors. Try again'
            }
            break
        case ExperimentState.WAITING_FOR_QUEUE:
            stateIcon = {
                iconName: 'wait',
                color: 'yellow',
                loading: false,
                title: 'The process of this experiment will start soon'
            }
            break
        case ExperimentState.NO_SAMPLES_IN_COMMON:
            stateIcon = {
                iconName: 'user outline',
                color: 'red',
                loading: false,
                title: 'Datasets don\'t have samples in common'
            }
            break
        case ExperimentState.IN_PROCESS:
            stateIcon = {
                iconName: 'sync alternate',
                color: 'yellow',
                loading: true,
                title: 'The experiment is being processed'
            }
            break
        case ExperimentState.STOPPING:
            stateIcon = {
                iconName: 'stop',
                loading: false,
                title: 'The experiment is being stopped',
                className: 'experiment-stopping-icon'
            }
            break
        case ExperimentState.STOPPED:
            stateIcon = {
                iconName: 'stop',
                color: 'red',
                loading: false,
                title: 'The experiment was stopped'
            }
            break
        case ExperimentState.REACHED_ATTEMPTS_LIMIT:
            stateIcon = {
                iconName: 'undo',
                color: 'red',
                loading: false,
                title: 'The experiment has failed several times. Try changing some parameters and try again.'
            }
            break
    }
    return stateIcon
}

/**
 * Gets info about an experiment's type to display in a Label
 * @param GEMType GEM FileType or Experiment to return its description
 * @param enumClass 'FileType' or 'ExperimentType' to check with the corresponding enum
 * @returns The corresponding info of the current experiment's type
 */
const getExperimentTypeObj = (
    GEMType: FileType | ExperimentType,
    enumClass: 'FileType' | 'ExperimentType'
): GEMImageAndLabelInfo => {
    const enumType = enumClass === 'FileType' ? FileType : ExperimentType
    let state: GEMImageAndLabelInfo
    switch (GEMType) {
        case enumType.MIRNA:
            state = {
                color: 'violet',
                description: 'MiRNA',
                image: 'miRNA.svg'
            }
            break
        case enumType.CNA:
            state = {
                color: 'purple',
                description: 'CNA',
                image: 'CNA.svg'
            }
            break
        case enumType.METHYLATION:
            state = {
                color: 'pink',
                description: 'Methylation',
                image: 'methylation.svg'
            }
            break
        default:
            state = {
                color: 'grey',
                description: 'Unknown type'
            }
            break
    }
    return state
}

/**
 * Gets info about an experiment's correlation method to display in a Label
 * @param correlationMethod Correlation method to be evaluated
 * @returns Experiment correlation method info
 */
const getExperimentCorrelationMethodInfo = (correlationMethod: CorrelationMethod): GEMImageAndLabelInfo => {
    let state: GEMImageAndLabelInfo
    switch (correlationMethod) {
        case CorrelationMethod.SPEARMAN:
            state = {
                color: 'olive',
                description: 'Spearman'
            }
            break
        case CorrelationMethod.KENDALL:
            state = {
                color: 'green',
                description: 'Kendall'
            }
            break
        case CorrelationMethod.PEARSON:
        default:
            state = {
                color: 'teal',
                description: 'Pearson'
            }
            break
    }
    return state
}

/**
 * Generates a default ExperimentResultTableControl state
 * @returns New default TableControl state
 */
function getDefaultExperimentTableControl<T> (): ExperimentResultTableControl<T> {
    return {
        pageNumber: 1,
        pageSize: 10,
        correlationType: CorrelationType.BOTH,
        coefficientThreshold: 0.7,
        sortFields: [],
        textFilter: '',
        totalRowCount: 0,
        showHighPrecision: true,
        filters: {}
    }
}

/**
 * Generates a default GeneralTableControl state
 * @returns New default TableControl state
 */
const getDefaultGeneralTableControl = (): GeneralTableControl => {
    return {
        pageNumber: 1,
        pageSize: 10,
        sortField: '',
        sortOrderAscendant: true,
        textFilter: '',
        totalRowCount: 0,
        filters: {}
    }
}

/**
 * Formats a date in locale format
 * @param dateToFormat Date to be formatted
 * @param format Format to apply. Default to MM/DD/YYYY
 * @returns Formatted date
 */
const formatDateLocale = (dateToFormat: string, format: string = 'L'): string => {
    // TODO: enable Typescript strict null checking to prevent this kind of fixes
    if (dateToFormat) {
        return dayjs(dateToFormat).format(format)
    }
    return '-'
}

/**
 * Generates a default Source
 * @param msg Message to show as default filename
 * @returns A source with all the field with default values
 */
const getDefaultSource = (msg: string = DEFAULT_FILENAME): Source => {
    return {
        type: SourceType.NONE,
        filename: msg,
        newUploadedFileRef: React.createRef(),
        selectedExistingFile: null,
        CGDSStudy: null
    }
}

/**
 * Gets the filename depending the source type: if it's a new dataset
 * it takes the filename of the selected file, if it's a previously uploaded file
 * it take its name specified by the user, and so on
 * @param source Source to take its filename
 * @param defaultFilename Filename to use in case that the source is not valid
 * @returns Filename of the source
 */
const getFilenameFromSource = (source: Source, defaultFilename: string = DEFAULT_FILENAME): string => {
    let filename: string = defaultFilename
    switch (source.type) {
        case SourceType.NEW_DATASET: {
            const sourceCurrent = source.newUploadedFileRef.current
            if (sourceCurrent !== null && sourceCurrent.files.length > 0) {
                filename = sourceCurrent.files[0].name
            }
            break
        }
        case SourceType.UPLOADED_DATASETS:
            if (source.selectedExistingFile) {
                filename = source.selectedExistingFile.name
            }
            break
        case SourceType.CGDS:
            if (source.CGDSStudy) {
                filename = source.CGDSStudy.name
            }
            break
    }
    return filename
}

/**
 * Gets the columns' name of an specific CSV file
 * @param csvFile CSV file to parse
 * @param separator Columns separator
 * @returns A Promise with an array of columns o a rejection with the event
 */
const getInputFileCSVColumns = (csvFile: File, separator: string = '\t'): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
        const fileReader = new FileReader()

        fileReader.onload = (event) => {
            if (event?.target) {
                const fileContent = event.target.result
                const firstLine = fileContent?.toString().split('\n').shift() // Only first line

                if (firstLine) {
                    resolve(firstLine.split(separator))
                }
            }

            resolve([])
        }

        fileReader.onerror = (event) => reject(event)
        fileReader.readAsText(csvFile)
    })
}

/**
 * Resets the value of a specified input ref
 * @param ref Reference to clean
 */
const cleanRef = (ref: React.RefObject<any>) => {
    const refCurrent = ref.current
    if (refCurrent) {
        refCurrent.value = ''
    }
}

/**
 * Generates a DropdownItemProps from a list of strings
 * @param listOfElements Array of strings to parse
 * @returns Dropdown Options
 */
const listToDropdownOptions = (listOfElements: string[]): DropdownItemProps[] => {
    return listOfElements.map((columnName) => {
        return { key: columnName, text: columnName, value: columnName }
    })
}

/**
 * Generates a GEM name/description to display
 * @param GEMType GEM FileType or Experiment to return its description
 * @param enumClass 'FileType' or 'ExperimentType' to check with the corresponding enum
 * @returns GEM name/description
 */
const getGemDescription = (GEMType: FileType | ExperimentType, enumClass: 'FileType' | 'ExperimentType'): string => {
    const enumType = enumClass === 'FileType' ? FileType : ExperimentType
    switch (GEMType) {
        case enumType.MIRNA:
            return 'miRNA'
        case enumType.CNA:
            return 'CNA'
    }
    return 'Methylation'
}

/**
 * Generates a file's rows description
 * @param fileType File type to analyse
 * @returns file's rows description
 */
const getFileRowDescriptionInPlural = (fileType: FileType): string => {
    let description: string
    switch (fileType) {
        case FileType.MRNA:
            description = 'mRNAs'
            break
        case FileType.CLINICAL:
            description = 'Clinical attributes'
            break
        default:
            description = `${getGemDescription(fileType, 'FileType')}s`
            break
    }
    return description
}

/**
 * Generate a default page size options array
 * @returns Array with page size options
 */
const getDefaultPageSizeOption = (): DropdownItemProps[] => [
    { key: '10', text: '10', value: 10 },
    { key: '25', text: '25', value: 25 },
    { key: '50', text: '50', value: 50 },
    { key: '100', text: '100', value: 100 }
]

/**
 * Generates a query parameter for sorting
 * @param sortField Field to sort
 * @param sortOrderIsAscendant Set in true if the sorting order is ascendant
 * @returns Query parameter or null
 */
const generatesOrderingQuery = (sortField: string, sortOrderIsAscendant: boolean): string => {
    if (sortField) {
        return `${sortOrderIsAscendant ? '' : '-'}${sortField}`
    }
    return ''
}

/**
 * Generates a query parameter for sorting with multi fields support
 * @param sortFields Field to sort
 * @returns Query parameter or null
 */
const generatesOrderingQueryMultiField = (sortFields: SortField<string>[]): string => {
    if (sortFields) {
        return sortFields.map((sortField) => `${sortField.sortOrderAscendant ? '' : '-'}${sortField.field}`)
            .join(',')
    }
    return ''
}

/** SemanticUI callback needed for an input change */
type SemanticUICallback = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void

/**
 * Generate a function that gets the event of a form's input's change and checks validity. If it's
 * successful, executes the callback passed by param
 * @param callback Callback to execute in case validation of the form is successful
 * @returns A function with input validation
 */
const checkedValidityCallback = (callback: HandleChangesCallback): SemanticUICallback => {
    return (event, { name, value }) => {
        if (event.target.checkValidity()) {
            callback(name, value)
        }
    }
}

/**
 * For short, gets correlation and p-values adjustment method description
 * @param correlationMethod Correlation method
 * @param pValuesAdjustmentMethod P-values adjustment method
 * @returns An array with correlation and p-values adjustment method description
 */
const getCorrelationAndPValuesAdjMethodsDescription = (
    correlationMethod: CorrelationMethod,
    pValuesAdjustmentMethod: PValuesAdjustmentMethod
): [string, string] => {
    const correlationMethodDescription = getExperimentCorrelationMethodInfo(correlationMethod).description
    const pValuesAdjustmentMethodDescription = getPValuesAdjustmentMethodDescription(pValuesAdjustmentMethod)
    return [correlationMethodDescription, pValuesAdjustmentMethodDescription]
}

/**
 * For reusability, gets a selected row and extracts Gene and GEM
 * Two empty string otherwise
 * @param selectedRow Selected row
 * @returns Gene and GEM if they're present. Two empty string otherwise
 */
const getGeneAndGEMFromSelectedRow = (selectedRow: Nullable<DjangoMRNAxGEMResultRow>): [string, string] => {
    return selectedRow ? [selectedRow.gene, selectedRow.gem] : ['', '']
}

/**
 * Checks if an Experiment source is valid
 * @param source ExperimentSource to check
 * @returns True if the source is valid for submission, false otherwise
 */
const experimentSourceIsValid = (source: Source): boolean => {
    return (
        source.type === SourceType.NEW_DATASET &&
        source.newUploadedFileRef.current !== null &&
        source.newUploadedFileRef.current.files.length > 0 &&
        getFileSizeInMB(source.newUploadedFileRef.current.files[0].size) <= MAX_FILE_SIZE_IN_MB_ERROR
    ) || (
        source.type === SourceType.UPLOADED_DATASETS &&
        source.selectedExistingFile !== null
    ) || (
        source.type === SourceType.CGDS &&
        source.CGDSStudy !== null
    )
}

/**
 * Converts bytes to Megabytes
 * @param fileSize File size in bytes to convert to Megabytes
 * @returns Fil size in Megabytes
 */
const getFileSizeInMB = (fileSize: number): number => fileSize / 1048576

/**
 * Get a color and description from a mirDIP Score Class
 * @param scoreClass Score class to evaluate
 * @returns A color and description
 */
const getScoreClassData = (scoreClass: MirDIPScoreClass): ScoreClassData => {
    switch (scoreClass) {
        case 'V':
            return {
                color: 'red',
                description: 'Very high'
            }
        case 'H':
            return {
                color: 'orange',
                description: 'High'
            }
        case 'M':
            return {
                color: 'yellow',
                description: 'Medium'
            }
        case 'L':
            return {
                color: 'olive',
                description: 'Low'
            }
    }
}

/**
 * Generate binned data from an array of numbers
 * @param data Data to compute the bins
 * @returns Binned data
 */
const generateBinData = (data: number[]): BinData[] => {
    // To make a better chart it keeps only one decimal
    const dataRounded = data.map((number) => number.toFixed(1))
    const valuesAndOccurrences: { [value: string]: number } = countBy(dataRounded)
    const binData: BinData[] = Object.entries(valuesAndOccurrences).map(elem => ({ value: parseFloat(elem[0]), count: elem[1] }))
    return binData
}

/**
 * Generate FileType description
 * @param type the FileType
 * @returns FileType description
 */
const getFileTypeName = (type: FileType): string => {
    let fileType: string
    switch (type) {
        case FileType.MRNA:
            fileType = 'mRNA'
            break
        case FileType.MIRNA:
            fileType = 'miRNA'
            break
        case FileType.CNA:
            fileType = 'CNA'
            break
        case FileType.METHYLATION:
            fileType = 'Methylation'
            break
        case FileType.CLINICAL:
            fileType = 'Clinical'
            break
        default:
            fileType = ''
            break
    }
    return fileType
}

export {
    getDjangoHeader,
    alertGeneralError,
    getFileTypeSelectOptions,
    getDefaultNewTag,
    parseValue,
    copyObject,
    getStateObj,
    getExperimentTypeObj,
    getDefaultExperimentTableControl,
    formatDateLocale,
    getExperimentCorrelationMethodInfo,
    getDefaultGeneralTableControl,
    getExperimentTypeSelectOptions,
    getCorrelationMethodSelectOptions,
    getAdjustmentMethodSelectOptions,
    getDefaultSource,
    getFilenameFromSource,
    getInputFileCSVColumns,
    cleanRef,
    listToDropdownOptions,
    getGemDescription,
    getDefaultPageSizeOption,
    generatesOrderingQuery,
    checkedValidityCallback,
    getFileRowDescriptionInPlural,
    getPValuesAdjustmentMethodDescription,
    getCorrelationAndPValuesAdjMethodsDescription,
    getGeneAndGEMFromSelectedRow,
    generatesOrderingQueryMultiField,
    experimentSourceIsValid,
    getFileSizeInMB,
    getScoreClassData,
    generateBinData,
    getFileTypeName
}
