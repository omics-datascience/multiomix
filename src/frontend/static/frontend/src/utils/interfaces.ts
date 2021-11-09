import { DjangoUserFile, DjangoCGDSStudy, DjangoMRNAxGEMResultRow, ExperimentType, CorrelationMethod, DjangoTag, PValuesAdjustmentMethod, DjangoSourceDataOutliersBasic, DjangoExperiment } from './django_interfaces'
import { SemanticICONS, SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'

/**
 * Common interfaces/types for better maintainability
 */
type Nullable<T> = T | null

/**
 * New mRNA x GEM experiment structure.
 * Used in the new experiment form
 */
interface NewExperiment {
    id?: number,
    name: string,
    description: string,
    correlationCoefficient: number,
    standardDeviationGene: number,
    standardDeviationGEM: number,
    mRNASource: Source,
    gemSource: Source,
    correlationMethod: CorrelationMethod,
    adjustmentMethod: PValuesAdjustmentMethod,
    correlateWithAllGenes: boolean,
    tag: DjangoTag
}

/**
 * Possible types of files
 */
enum FileType {
    ALL = 0,
    MRNA = 1,
    MIRNA = 2,
    CNA = 3,
    METHYLATION = 4,
    CLINICAL = 5
}

/**
 * Enum to check if user want to select source from a file
 * that he uploaded, or from CGDS DB
 */
enum SourceType {
    NONE = 0,
    UPLOADED_DATASETS = 1,
    CGDS = 2,
    NEW_DATASET = 3
}

/**
 * A command key -> function
 * to define which the Websocket has to attend
 */
interface Command {
    key: string,
    functionToExecute: () => void
}

/**
 * Websocket class settings
 */
interface WebsocketConfig {
    channelUrl: string, // Channel identifier to connect
    commandsToAttend: Command[]
}

/**
 * Possible Correlation Type
 */
enum CorrelationType {
    POSITIVE = 1,
    NEGATIVE = 2,
    BOTH = 3
}

/**
 * Possible separators for downloaded datasets
 */
enum CGDSDatasetSeparator {
    COMMA = ',',
    SEMICOLON = ';',
    TAB = '\t',
    COLON = ':',
    WHITE_SPACE = ' '
}

/** A table control structure which supports sorting by multiple field */
interface GeneralTableControlWithoutSorting {
    pageNumber: number,
    pageSize: number,
    textFilter: string,
    // TODO: after big refactoring using only PaginatedTable.tsx, check if totalRowCount is optional
    totalRowCount?: number,
    // TODO: after big refactoring using only PaginatedTable.tsx, check if filters is optional
    filters: { [key: string]: any },
}

/**
 * Table filters, page number, page size, etc
 */
interface GeneralTableControl<T = string> extends GeneralTableControlWithoutSorting {
    sortField: T,
    sortOrderAscendant: boolean,
}

/** Sorting structure for multiple sorting support */
type SortField<T> = {
    field: T,
    sortOrderAscendant: boolean,
    name: string // Useful for sorting text in ExperimentResultView
}

/**
 * Table control with more filter field of an Pipeline result
 */
interface ExperimentResultTableControl<T = string> extends GeneralTableControlWithoutSorting {
    sortFields: SortField<T>[]
    correlationType: CorrelationType,
    coefficientThreshold: number,
    showHighPrecision: boolean
}

type AllExperimentsSortField = 'name' | 'description' | 'submit_date' | 'state' | 'type' | 'correlation_method' | 'tag'

/**
 * AllExperiments Table filters (same as GeneralTableControl but with some custom fields)
 */
interface AllExperimentsTableControl extends GeneralTableControl<AllExperimentsSortField> {
    /** Experiment type to filter */
    experimentType: ExperimentType,
    /** Id of the tag to filter */
    tagId: Nullable<number>,
    /** Correlation Method used, to filter */
    correlationMethod: CorrelationMethod
}

/**
 * Datasets UserFile Modal table filters (same as GeneralTableControl but with some custom fields)
 */
interface DatasetModalUserFileTableControl<T = string> extends GeneralTableControl<T> {
    /** Id of the tag to filter */
    tagId: Nullable<number>,
    /** Id of institution to filter */
    visibility: 'all' | 'private' | 'public' | number
}

/**
 * A pipeline's source
 */
interface Source {
    /** Id of the source, useful to edit */
    id?: number,
    /** Source type: Own dataset, new dataset, CGDS, etc */
    type: Nullable<SourceType>,
    /** Filename to display */
    filename: string,
    /** Reference to a file that is being uploaded by the user (used in case type === SourceType.NEW_DATASET) */
    newUploadedFileRef: React.RefObject<any>,
    /** A file that has been uploaded previously by the user (used in case type === SourceType.UPLOADED_DATASETS) */
    selectedExistingFile: Nullable<DjangoUserFile>,
    /** A synchronized CGDS Study (used in case type === SourceType.CGDS) */
    CGDSStudy: Nullable<DjangoCGDSStudy>
}

/**
 * Django REST Framework Paginated Response structure
 */
interface ResponseRequestWithPagination<T> {
    /** Total elements in DB count */
    count: number,
    /** Elements */
    results: T[]
}

/**
 * Possible CGDS dataset name in a CGDS Study
 */
type NameOfCGDSDataset = 'mrna_dataset' | 'mirna_dataset' | 'cna_dataset' | 'methylation_dataset' | 'clinical_patient_dataset' | 'clinical_sample_dataset';

/**
 * State icon info
 */
interface ExperimentStateInfo {
    iconName: SemanticICONS,
    color?: SemanticCOLORS,
    loading: boolean,
    title: string,
    className?: string
}

/**
 * Experiment type info
 */
interface GEMImageAndLabelInfo {
    color: SemanticCOLORS,
    description: string,
    image?: string
}

/**
 * Displayed Experiment's info in table
 */
interface ExperimentInfo {
    experiment: DjangoExperiment,
    rows: DjangoMRNAxGEMResultRow[],
    totalRowCount: number
}

/** Prefix in param of a request to run a new Experiment */
type ExperimentRequestPrefix = 'mRNA' | 'gem'

/** Common type of changes handling for inputs */
type HandleChangesCallback = (name: string, value: string) => void

/**
 * mirDIP values for score class
 * V = Very high
 * H = High
 * M = Medium
 * L = Low
 */
type MirDIPScoreClass = 'V' | 'H' | 'M' | 'L'

/** Custom data to show in frontend for a MirDIPScoreClass value */
type ScoreClassData = {
    color: 'red' | 'orange' | 'yellow' | 'olive',
    description: 'Very high' | 'High' | 'Medium' | 'Low'
}

/**
 * Data structure needed for stats charts
 */
interface StatChartData {
    data: number[],
    x?: string, // Useful for vertical Boxplots
    fillColor?: string,
    strokeColor?: string
}

interface StatChartDataWithOutliers extends StatChartData {
    outliers: DjangoSourceDataOutliersBasic[]
}

/** Structure of a Reference card in assumption panel */
interface ReferenceCard {
    color: SemanticCOLORS,
    image: string,
    href: string
}

/** Type of Search params used in Ky to force type assertion */
type KySearchParams = string | { [key: string]: string | number | boolean; } | (string | number | boolean)[][] | URLSearchParams | undefined

/** LogRank statistic and p-value */
type LogRankStatistic = {
    test_statistic: number
    p_value: number
}

/** Binned data */
type BinData = { value: number, count: number }

/** Structure of categorical data for Data UI Histogram with binType = 'categorical' */
type DataUICategoricalBinnedDatumShape = {
    id: string,
    bin: string,
    count: number,
}

export {
    Nullable,
    FileType,
    Command,
    WebsocketConfig,
    CorrelationType,
    SourceType,
    Source,
    CGDSDatasetSeparator,
    NameOfCGDSDataset,
    GeneralTableControl,
    ResponseRequestWithPagination,
    ExperimentStateInfo,
    GEMImageAndLabelInfo,
    ExperimentInfo,
    ExperimentResultTableControl,
    AllExperimentsTableControl,
    AllExperimentsSortField,
    NewExperiment,
    ExperimentRequestPrefix,
    DatasetModalUserFileTableControl,
    HandleChangesCallback,
    StatChartData,
    StatChartDataWithOutliers,
    ReferenceCard,
    KySearchParams,
    SortField,
    LogRankStatistic,
    MirDIPScoreClass,
    ScoreClassData,
    BinData,
    DataUICategoricalBinnedDatumShape
}
