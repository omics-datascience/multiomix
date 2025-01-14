import { FileType, CGDSDatasetSeparator, ResponseRequestWithPagination, Nullable, MirDIPScoreClass } from './interfaces'
import { SemanticShorthandItem, SemanticWIDTHS } from 'semantic-ui-react/dist/commonjs/generic'
import { PopupContentProps, StrictTableCellProps } from 'semantic-ui-react'

/**
 * Possible states for experiment evaluation
 */
enum ExperimentState {
    WAITING_FOR_QUEUE = 1,
    IN_PROCESS = 2,
    COMPLETED = 3,
    FINISHED_WITH_ERROR = 4,
    NO_SAMPLES_IN_COMMON = 5,
    STOPPED = 7,
    REACHED_ATTEMPTS_LIMIT = 8,
    TIMEOUT_EXCEEDED = 9,
}

/**
 * Possible states for CGDS Study synchronization
 */
enum CGDSStudySynchronizationState {
    NOT_SYNCHRONIZED = 0,
    WAITING_FOR_QUEUE = 1,
    IN_PROCESS = 2,
    COMPLETED = 3,
    FINISHED_WITH_ERROR = 4,
    URL_ERROR = 5,
    CONNECTION_TIMEOUT_ERROR = 6,
    READ_TIMEOUT_ERROR = 7,
    TIMEOUT_EXCEEDED = 9,
    STOPPED = 10
}

/**
 * Possible states for CGDS Dataset synchronization
 */
enum CGDSDatasetSynchronizationState {
    NOT_SYNCHRONIZED = 0,
    SUCCESS = 1,
    FINISHED_WITH_ERROR = 2,
    FILE_DOES_NOT_EXIST = 3,
    COULD_NOT_SAVE_IN_MONGO = 4,
    NO_PATIENT_ID_COLUMN_FOUND = 5
}

/**
 * Possible Correlation methods
 */
enum CorrelationMethod {
    ALL = 0,
    SPEARMAN = 1,
    KENDALL = 2,
    PEARSON = 3
}

/**
 * Possible P-value adjustment methods
 */
enum PValuesAdjustmentMethod {
    BENJAMINI_HOCHBERG = 1,
    BENJAMINI_YEKUTIELI = 2,
    BONFERRONI = 3
}

/**
 * Possible states when retrieving an experiment result
 */
enum DjangoExperimentResultInternalCode {
    DOES_NOT_EXIST = 1,
    CONNECTION_TIMEOUT = 2,
    INVALID_PARAMS = 3
}

/**
 * Possible states when gets the number of sample in common between
 * two datasets. Same as CommonSamplesStatusErrorCode Enum in the Python code
 */
enum DjangoSamplesInCommonResultInternalCode {
    DATASET_DOES_NOT_EXISTS = 1,
    SOURCE_TYPE_DOES_NOT_EXISTS = 2,
    INVALID_PARAMS = 3
}

/**
 * Possible states when retrieve data for a correlation graph
 */
enum DjangoCorrelationGraphInternalCode {
    INVALID_GENE_OR_GEM_NAMES = 1,
    EXPERIMENT_DOES_NOT_EXISTS = 2,
    INVALID_PARAMS = 3
}

/**
 * Possible states when adds/removes an User to/from an Institution
 */
enum DjangoAddRemoveUserToInstitutionInternalCode {
    USER_DOES_NOT_EXIST = 1,
    INSTITUTION_DOES_NOT_EXIST = 2,
    INVALID_PARAMS = 3,
    CANNOT_REMOVE_YOURSELF = 4
}

/**
 * Possible states when uploads a file in the Datasets/Multiomix menu
 */
enum DjangoUserFileUploadErrorInternalCode {
    INVALID_FORMAT_NON_NUMERIC = 1
}

/**
 * A simple structure Experiment's source's CGDSDataset info
 */
interface SourceSimpleCGDSDataset {
    name: string,
    description: string,
    file_type: FileType,
    version: number,
    date_last_synchronization: Nullable<string>,
    file_obj: string
}

/**
 * Structure of the MethylationPlatform enum
 */
enum DjangoMethylationPlatform {
    PLATFORM_450 = 450
}

/** Structure of SurvivalColumnsTuple model but without field 'clinical_dataset' */
interface DjangoSurvivalColumnsTupleSimple {
    id?: number,
    time_column: string,
    event_column: string
}

/**
 * Django Model api_service.CGDSDataset
 */
interface DjangoCGDSDataset {
    file_path: string,
    separator: CGDSDatasetSeparator,
    observation: string,
    header_row_index: number,
    date_last_synchronization?: string,
    state?: CGDSDatasetSynchronizationState,
    number_of_rows?: number,
    number_of_samples?: number,
    is_cpg_site_id: boolean,
    platform: DjangoMethylationPlatform,
    mongo_collection_name: string,
    survival_columns?: DjangoSurvivalColumnsTupleSimple[] // Only valid for files with patient data 'clinical_patient_dataset'
}

/**
 * Structure of current user simplest data in frontend
 */
interface DjangoUserSimple {
    id: number,
    username: string,
}

/**
 * Structure of current user complete data in frontend
 */
interface DjangoUser {
    /** ID of the user. Is null in case of anonymous user */
    id: Nullable<number>,
    /** Username. Is null in case of anonymous user */
    username: Nullable<string>,
    /** Indicates if the user is not logged into system */
    is_anonymous: boolean,
    /** Indicates if the user is a Django super admin */
    is_superuser: boolean,
    /** Indicates if the user is admin of at least one institution */
    is_institution_admin: boolean,
}

/**
 * Django Institution model interface
 * but with only some fields
 */
interface DjangoInstitutionSimple {
    id: number,
    name: string
}

/**
 * Tags are different for Files and Experiments
 */
enum TagType {
    FILE = 1,
    EXPERIMENT = 2
}

/**
 * Django Tag model interface
 */
interface DjangoTag {
    id: Nullable<number>,
    name: string,
    description: string,
    parent_tag: Nullable<DjangoTag>,
    type: TagType
}

/**
 * A simple structure of UserFile model
 */
interface DjangoSimpleUserFile {
    id?: number
    name: string,
    description: Nullable<string>,
    file_type: FileType,
}

/**
 * Django UserFile model interface
 */
interface DjangoUserFile extends DjangoSimpleUserFile {
    id?: number,
    tag: DjangoTag,
    upload_date?: string,
    institutions: DjangoInstitutionSimple[],
    is_private_or_institution_admin: boolean,
    number_of_rows: number,
    number_of_samples: number,
    contains_nan_values: boolean,
    column_used_as_index: string,
    is_cpg_site_id: boolean,
    platform: DjangoMethylationPlatform,
    user: DjangoUserSimple,
    survival_columns?: DjangoSurvivalColumnsTupleSimple[],
    is_public: boolean
}

/**
 * Django Model api_service.ExperimentSource
 */
interface DjangoExperimentSource {
    id?: number,
    user_file: DjangoSimpleUserFile,
    cgds_dataset: SourceSimpleCGDSDataset,
    number_of_rows: number,
    number_of_samples: number
}

/**
 * Structure of ExperimentClinicalSource model
 */
interface DjangoExperimentClinicalSource extends DjangoExperimentSource {
    user_file: DjangoUserFile
    extra_cgds_dataset: SourceSimpleCGDSDataset
}

/**
 * Possible types of an experiment to differentiate the pipeline
 */
enum ExperimentType {
    ALL = 0,
    MIRNA = 1,
    CNA = 2,
    METHYLATION = 3
}

/**
 * Django Model api_service.Experiment
 */
interface DjangoExperiment {
    id: number,
    name: string,
    description: string,
    mRNA_source: DjangoExperimentSource,
    gem_source: DjangoExperimentSource,
    submit_date: string,
    minimum_coefficient_threshold: number,
    correlation_method: CorrelationMethod,
    state: ExperimentState,
    evaluated_row_count: number,
    result_total_row_count: number,
    result_final_row_count: number,
    p_values_adjustment_method: PValuesAdjustmentMethod,
    tag: DjangoTag,
    type: ExperimentType,
    clinical_source_id: Nullable<number>,
    is_public: boolean,
}

/** A reduced structure of Gene model */
interface GeneExtraData {
    type: string,
    chromosome: string,
    start: number,
    end: number,
    description: string,
}

/**
 * JSON Structure of a MongoDB mRNA x MiRNA experiment result row
 */
interface DjangoMRNAxGEMResultRow {
    id: number,
    gene: string,
    gem: string,
    correlation: number,
    p_value: number,
    adjusted_p_value: number,
    experiment_type: ExperimentType,
    gene_extra_data: Nullable<GeneExtraData>
}

/**
 * A row header has the name and a server code
 * to handles some operations like sort or filter
 */
interface RowHeader<T> {
    /** Name to show as column header. */
    name: string,
    /** Key to send in 'ordering' Django endpoint's query param to apply a sorting by this field in backend. */
    serverCodeToSort?: keyof T,
    /** Width of the column. */
    width?: SemanticWIDTHS,
    /** Title to show on hover the header. */
    title?: string,
    /** Text align of the column. */
    textAlign?: StrictTableCellProps['textAlign'],
    /** If it's defined, an InfoPopup is shown with this content. */
    infoPopupContent?: SemanticShorthandItem<PopupContentProps>
}

/**
 * JSON Structure of MongoDB mRNA x MiRNA experiment result + some extra experiment info
 * like minimum selected threshold, and others useful filed
 */
interface DjangoMRNAxGEMResultJSON {
    type: ExperimentType
    minimum_coefficient_threshold: number,
    combinations: ResponseRequestWithPagination<DjangoMRNAxGEMResultRow>,
}

/**
 * JSON structure of the service that returns the number of samples in common between
 * two datasets (UserFiles or CGDSDataset)
 */
interface DjangoSamplesInCommonResultJSON {
    number_samples_in_common: number,
    number_samples_mrna: number,
    number_samples_gem: number
}

/**
 * JSON structure of the service that returns the number of samples in common between
 * two datasets (UserFiles or CGDSDataset)
 */
interface DjangoSamplesInCommonOneFrontResultJSON {
    number_samples_in_common: number,
    number_samples_backend: number
}

/**
 * JSON Structure of Correlation Graph info
 */
interface DjangoCorrelationGraphJSON {
    gene_values: number[],
    gem_values: number[],
    is_data_ok: boolean,
    clinical_columns: string[],
    clinical_values: string[]
}

/**
 * JSON Structure of miRNA interaction info
 */
interface DjangoMiRNAGeneInteractionJSON {
    id: number,
    mirna: string,
    gene: string,
    score: number,
    source_name: string,
    pubmeds: string[],
    sources: string[],
    score_class: MirDIPScoreClass
}

/** Modulector source link structure */
type ModulectorSourceLink = { source: string, url: string }

/**
 * JSON Structure of miRNA data from Modulector.
 */
interface DjangoMiRNADataJSON {
    aliases: string[],
    mirna_sequence: string,
    mirbase_accession_id: string,
    links: ModulectorSourceLink[],
}

/** Structure of `ucsc_cpg_islands` field in methylation data from Modulector */
type UCSCCpGIsland = {
    cpg_island: string,
    relation: string
}

/**
 * JSON Structure of methylation data from Modulector.
 */
interface DjangoMethylationDataJSON {
    name: string,
    aliases: string[],
    chromosome_position: string,
    ucsc_cpg_islands: UCSCCpGIsland[],
    genes: { [gene: string]: string[] }
}

/**
 * JSON Structure of miRNA diseases info
 */
interface DjangoMiRNADiseasesJSON {
    id: number,
    category: string,
    disease: string,
    pubmed: string,
    description: string
}

/**
 * JSON Structure of miRNA drugs info
 */
interface DjangoMiRNADrugsJSON {
    id: number,
    small_molecule: string,
    fda_approved: boolean,
    detection_method: string,
    condition: string,
    pubmed: string,
    reference: string,
    expression_pattern: string,
    support: string
}

/**
 * Django Institution model interface
 */
interface DjangoInstitution {
    id?: number,
    name: string,
    location: string,
    email: string,
    telephone_number: string,
    users?: DjangoUser[]
}

/**
 * Django Institution user
 */
interface DjangoInstitutionUser {
    user: {
        id: number,
        username: string,
    },
    id: number,
    is_institution_admin: boolean,
}

/**
 * Django UserFile model interface
 */
interface DjangoCGDSStudy {
    id?: number,
    name: string,
    description: string,
    date_last_synchronization?: string,
    url: string,
    url_study_info: string,
    version: Nullable<number>,
    is_last_version: boolean,
    state?: CGDSStudySynchronizationState,
    mrna_dataset: Nullable<DjangoCGDSDataset>,
    mirna_dataset: Nullable<DjangoCGDSDataset>,
    cna_dataset: Nullable<DjangoCGDSDataset>,
    methylation_dataset: Nullable<DjangoCGDSDataset>,
    clinical_patient_dataset: Nullable<DjangoCGDSDataset>,
    clinical_sample_dataset: Nullable<DjangoCGDSDataset>,
}

/**
 * Structure of the list of users to select to add to an Institution
 */
interface DjangoUserCandidates {
    id: number,
    username: string,
    email: string
}

/**
 * Possible response code (to check if something failed)
 */
enum DjangoResponseCode {
    SUCCESS = 1,
    ERROR = 2
}

/**
 * Response status to check in frontend if it failed CGDS Study synchronization
 */
enum DjangoSyncCGDSStudyResponseCode {
    SUCCESS = 1,
    ERROR = 2,
    NOT_ID_IN_REQUEST = 3,
    CGDS_STUDY_DOES_NOT_EXIST = 4
}

/**
 * Response status to check in frontend if it failed CGDS Study synchronization
 * NOTE: uses string value due to https://github.com/encode/django-rest-framework/issues/7532#issue-698456113
 */
enum DjangoCreateCGDSStudyResponseCode {
    CGDS_WITH_DUPLICATED_COLLECTION_NAME = '1'
}

/**
 * A Django response status to check errors
 */
interface DjangoResponseStatus<T> {
    code: DjangoResponseCode,
    message: string
    // NOTE: internal_code's values are specific of every request
    internal_code: T
}

/**
 * General Django response. By default, ALL Django custom response
 * have a 'status' field
 */
interface DjangoCommonResponse<INTERNAL_CODE_STATUS = null> {
    status: DjangoResponseStatus<INTERNAL_CODE_STATUS>
}

/**
 * Django samples in common service Response
 */
interface DjangoNumberSamplesInCommonResult extends DjangoCommonResponse<DjangoSamplesInCommonResultInternalCode> {
    data: DjangoSamplesInCommonResultJSON
}

interface DjangoSamplesInCommonResultClinicalValidationJSON extends DjangoSamplesInCommonResultJSON {
    number_samples_clinical: number
}

interface DjangoNumberSamplesInCommonClinicalValidationResult extends DjangoCommonResponse<DjangoSamplesInCommonResultInternalCode> {
    data: DjangoSamplesInCommonResultClinicalValidationJSON
}

/**
 * Django samples in common service Response with one Source in frontend
 */
interface DjangoNumberSamplesInCommonOneFrontResult extends DjangoCommonResponse<DjangoSamplesInCommonResultInternalCode> {
    data: DjangoSamplesInCommonOneFrontResultJSON
}

/**
 * Django correlation graph service response. It's a common response
 * but with the field 'data'
 */
interface DjangoResponseGetCorrelationGraph extends DjangoCommonResponse<DjangoCorrelationGraphInternalCode> {
    data: DjangoCorrelationGraphJSON
}

/**
 * Django error response when uploads a file in the Datasets/Multiomix menu
 */
interface DjangoResponseUploadUserFileError {
    // It's a field's name as Django Rest Framework returns the validations like that!
    file_obj: DjangoCommonResponse<DjangoUserFileUploadErrorInternalCode>
}

/**
 * Django CGDS Study synchronization response
 */
interface DjangoResponseSyncCGDSStudyResult {
    status: {
        code: DjangoSyncCGDSStudyResponseCode,
        message: string
    }
}

/** Django BreuschPaganTest model */
interface DjangoBreuschPaganTest {
    lagrange_multiplier: number,
    p_value: number,
    f_value: number,
    f_p_value: number
}

/** Django NormalityTest model */
interface DjangoNormalityTest {
    statistic: number,
    p_value: number
}

/** Django GoldfeldQuandtTest model */
interface DjangoGoldfeldQuandtTest {
    statistic: number,
    p_value: number
}

/** Django LinearityTest model */
interface DjangoLinearityTest {
    statistic: number,
    p_value: number
}

/** Django MonotonicityTest model */
interface DjangoMonotonicityTest {
    statistic: number,
    p_value: number
}

/** Django SourceDataOutliers model WITH ONLY USED FIELD */
interface DjangoSourceDataOutliersBasic {
    sample_identifier: string,
    expression: number,
}

/** Django SourceDataStatisticalProperties model */
interface DjangoSourceDataStatisticalProperties {
    gene_mean: number,
    gem_mean: number,
    gene_standard_deviation: number,
    gem_standard_deviation: number,
    gene_normality: DjangoNormalityTest,
    gem_normality: DjangoNormalityTest,
    heteroscedasticity_breusch_pagan: DjangoBreuschPaganTest,
    homoscedasticity_goldfeld_quandt: DjangoGoldfeldQuandtTest,
    number_of_samples_evaluated: number,
    linearity: DjangoLinearityTest,
    monotonicity: DjangoMonotonicityTest,
    gene_outliers: DjangoSourceDataOutliersBasic[],
    gem_outliers: DjangoSourceDataOutliersBasic[]
}

/** Response structure of the SourceDataStatisticalProperties request */
interface SourceDataStatisticalPropertiesResponse extends DjangoSourceDataStatisticalProperties {
    gene_data: number[],
    gem_data: number[],
    is_data_ok: boolean // To check if the data could be correctly computed
}

export {
    ExperimentState,
    DjangoMRNAxGEMResultRow,
    RowHeader,
    DjangoMRNAxGEMResultJSON,
    DjangoTag,
    DjangoUserFile,
    DjangoResponseCode,
    DjangoExperimentResultInternalCode,
    DjangoNumberSamplesInCommonResult,
    DjangoCommonResponse,
    ExperimentType,
    TagType,
    DjangoCGDSStudy,
    DjangoCGDSDataset,
    CGDSStudySynchronizationState,
    CGDSDatasetSynchronizationState,
    DjangoSyncCGDSStudyResponseCode,
    DjangoCreateCGDSStudyResponseCode,
    DjangoResponseSyncCGDSStudyResult,
    CorrelationMethod,
    DjangoCorrelationGraphInternalCode,
    DjangoResponseGetCorrelationGraph,
    DjangoMiRNAGeneInteractionJSON,
    DjangoMiRNADiseasesJSON,
    DjangoMiRNADrugsJSON,
    DjangoNumberSamplesInCommonOneFrontResult,
    DjangoExperiment,
    DjangoUser,
    DjangoInstitution,
    DjangoUserCandidates,
    DjangoAddRemoveUserToInstitutionInternalCode,
    DjangoInstitutionSimple,
    PValuesAdjustmentMethod,
    DjangoExperimentSource,
    DjangoExperimentClinicalSource,
    SourceSimpleCGDSDataset,
    DjangoMethylationPlatform,
    DjangoResponseUploadUserFileError,
    DjangoUserFileUploadErrorInternalCode,
    SourceDataStatisticalPropertiesResponse,
    DjangoNormalityTest,
    DjangoBreuschPaganTest,
    DjangoGoldfeldQuandtTest,
    DjangoLinearityTest,
    DjangoMiRNADataJSON,
    DjangoMethylationDataJSON,
    DjangoSourceDataOutliersBasic,
    DjangoMonotonicityTest,
    DjangoSurvivalColumnsTupleSimple,
    DjangoNumberSamplesInCommonClinicalValidationResult,
    DjangoInstitutionUser
}
