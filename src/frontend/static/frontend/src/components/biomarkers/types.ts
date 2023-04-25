import { DjangoTag } from '../../utils/django_interfaces'
import { Nullable, Source } from '../../utils/interfaces'

/** Possible types of a Biomarker. */
enum BiomarkerType {
    MRNA = 'mRNA',
    MIRNA = 'miRNA',
    CNA = 'CNA',
    METHYLATION = 'Methylation',
}

/** All the possible ways to create a Biomarker. */
enum BiomarkerOrigin {
    /** Only used in frontend to show the modal to select the Biomarker type. */
    BASE = 0,
    MANUAL = 1,
    INTERSECTION = 2,
    FEATURE_SELECTION = 3,
    DIFFERENTIAL_EXPRESSION = 4
}

/** All the possible states of a Biomarker. */
enum BiomarkerState {
    COMPLETED = 1,
    FINISHED_WITH_ERROR = 2,
    IN_PROCESS = 3,
    WAITING_FOR_QUEUE = 4,
    NO_SAMPLES_IN_COMMON = 5,
    STOPPING = 6,
    STOPPED = 7,
    REACHED_ATTEMPTS_LIMIT = 8

}

enum MoleculesTypeOfSelection {
    INPUT = 'input',
    AREA = 'area',
}

// TODO: attributes 'number_of_...', 'state' and 'origin' only are used in API GET service, not in the form, define and use
// TODO: two different interfaces
/** Django Biomarker model. */
interface Biomarker {
    id: Nullable<number>,
    name: string,
    description: string,
    tag: Nullable<DjangoTag>,
    upload_date?: string,
    number_of_mrnas: number,
    number_of_mirnas: number,
    number_of_cnas: number,
    number_of_methylations: number,
    has_fs_experiment: boolean,
    origin: BiomarkerOrigin,
    state: BiomarkerState,
    contains_nan_values: boolean,
    column_used_as_index: string,
    mirnas: SaveMoleculeStructure[],
    methylations: SaveMoleculeStructure[],
    cnas: SaveMoleculeStructure[],
    mrnas: SaveMoleculeStructure[]
}

interface ConfirmModal {
    confirmModal: boolean,
    headerText: string,
    contentText: string,
    onConfirm: Function,
}

/** Represents a molecule info to show in molecules Dropdown. */
type MoleculeSymbol = {
    key: string,
    text: string,
    value: string
}

/** Represents the state of a request to get molecules information during Biomarkers creation. */
type MoleculesSymbolFinder = {
    isLoading: boolean,
    data: MoleculeSymbol[]
}

/** Structure to handle the new Biomarker form. */
interface FormBiomarkerData {
    id: Nullable<number>,
    biomarkerName: string,
    biomarkerDescription: string,
    tag: any, // se esta laburando salu2
    moleculeSelected: BiomarkerType,
    moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT | MoleculesTypeOfSelection.AREA,
    moleculesSection: MoleculesSection,
    validation: ValidationSection
    moleculesSymbolsFinder: MoleculesSymbolFinder,
}

interface ValidationSection {
    haveAmbiguous: boolean,
    haveInvalid: boolean,
    isLoading: boolean,
    checkBox: boolean,
}

interface MoleculesMultipleSelection {
    key: number;
    text: string;
    value: number;
}

/** Structure to create/update a molecule in a Biomarker. */
type SaveMoleculeStructure = {
    id?: number, // If undefined it means it's a new molecule. If present, then the molecule instance is updated
    identifier: string
}

/** Structure to make a request and create/update a Biomarker. */
interface SaveBiomarkerStructure {
    name: string,
    description: string,
    mrnas: SaveMoleculeStructure[],
    mirnas: SaveMoleculeStructure[],
    methylations: SaveMoleculeStructure[],
    cnas: SaveMoleculeStructure[],
}

type MoleculesSection = {
    [BiomarkerType.CNA]: MoleculeSectionItem,
    [BiomarkerType.MIRNA]: MoleculeSectionItem,
    [BiomarkerType.METHYLATION]: MoleculeSectionItem,
    [BiomarkerType.MRNA]: MoleculeSectionItem,
}

interface MoleculeSectionItem {
    isLoading: boolean,
    data: MoleculesSectionData[]
}

interface MoleculesSectionData {
    isValid: boolean,
    value: string | string[],
}

/** Available Feature Selection algorithms. */
enum FeatureSelectionAlgorithm {
    BLIND_SEARCH = 1,
    COX_REGRESSION = 2,
    BBHA = 3,
    PSO = 4
}

/** Available fitness functions. */
enum FitnessFunction {
    CLUSTERING = 1,
    SVM = 2,
    RF = 3
}

/** Clustering algorithm. */
enum ClusteringAlgorithm {
    K_MEANS = 1,
    SPECTRAL = 2
}

/** Clustering metric to optimize. */
enum ClusteringMetric {
    COX_REGRESSION = 1,
    LOG_RANK_TEST = 2
}

/** Clustering scoring method. */
enum ClusteringScoringMethod {
    C_INDEX = 1,
    LOG_LIKELIHOOD = 2
}

/** SVM's kernel */
enum SVMKernel {
    LINEAR = 1,
    POLYNOMIAL = 2,
    RBF = 3,
}

/** Task to execute with survival SVM. */
enum SVMTask {
    RANKING = 1,
    REGRESSION = 2
}

/** Settings for the Clustering fitness function. */
interface FitnessFunctionClustering{
    algorithm: ClusteringAlgorithm,
    scoringMethod: ClusteringScoringMethod,
    metric: ClusteringMetric
}

/** Settings for the SVM fitness function. */
interface FitnessFunctionSvm{
    kernel: SVMKernel
    task: SVMTask
}

/** All the different fitness functions' parameters. */
interface FitnessFunctionParameters {
    clusteringParameters: FitnessFunctionClustering,
    svmParameters: FitnessFunctionSvm
}

/** Structure for the Feature Selection panel. */
interface FeatureSelectionPanelData {
    /** Current Step in the panel. */
    step: number;
    /** Biomarker instance to optimize with Feature Selection. */
    biomarker: Nullable<Biomarker>;
    /** Selected Biomarker instance in the Biomarkers table. */
    selectedBiomarker: Nullable<Biomarker>;
    /** Clinical source. */
    clinicalSource: Source,
    /** mRNA source. */
    mRNASource: Source,
    /** mirna source. */
    mirnaSource: Source,
    /** cna source. */
    cnaSource: Source,
    /** methylation source. */
    methylationSource: Source,
    /** Algorithm to make Feature Selection. */
    algorithm: FeatureSelectionAlgorithm,
    /** Fitness function to optimize in the algorithm. */
    fitnessFunction: FitnessFunction,
    /** Parameters of the selected `fitnessFunction`. */
    fitnessFunctionParameters: FitnessFunctionParameters
}

/** Available types of Sources for a Biomarker. */
type SourceStateBiomarker = 'clinicalSource' | 'mRNASource' | 'mirnaSource' | 'methylationSource' | 'cnaSource'

/** Available options for the Menu in the Biomarker details modal */
enum ActiveBiomarkerDetailItemMenu {
    DETAILS,
    FEATURE_SELECTION_SUMMARY,
    MODELS,
    STATISTICAL_VALIDATION,
    PREDICT
}

/** Django TrainedModel model. */
interface TrainedModel {
    id: number,
    created: string,
    best_fitness_value: number
}

/**
 * Represents a connection between a source and a statistical validation result. Useful to show a result for
 * every type of molecule in a Biomarker.
 */
interface StatisticalValidationSourceResult {
    id: number,
    c_index: Nullable<number>,
    log_likelihood: Nullable<number>,
    roc_auc: Nullable<number>,
    source: Source
}

/** A statistical validation of a Biomarker. */
interface StatisticalValidation {
    id: number,
    name: string,
    description: Nullable<string>,
    created: string,
    c_index: number,
    log_likelihood: number,
    roc_auc: number,
    clinical_source: Nullable<StatisticalValidationSourceResult>,
    mrna_source_result: Nullable<StatisticalValidationSourceResult>,
    mirna_source_result: Nullable<StatisticalValidationSourceResult>,
    cna_source_result: Nullable<StatisticalValidationSourceResult>,
    methylation_source_result: Nullable<StatisticalValidationSourceResult>,
}

export {
    SVMKernel,
    SVMTask,
    FitnessFunctionSvm,
    FitnessFunctionClustering,
    FitnessFunctionParameters,
    FitnessFunction,
    FeatureSelectionAlgorithm,
    ClusteringMetric,
    ClusteringAlgorithm,
    SourceStateBiomarker,
    FeatureSelectionPanelData,
    BiomarkerOrigin,
    BiomarkerState,
    SaveMoleculeStructure,
    SaveBiomarkerStructure,
    Biomarker,
    BiomarkerType,
    FormBiomarkerData,
    MoleculesTypeOfSelection,
    MoleculesMultipleSelection,
    MoleculesSectionData,
    MoleculeSectionItem,
    ConfirmModal,
    MoleculeSymbol,
    MoleculesSymbolFinder,
    ClusteringScoringMethod,
    ActiveBiomarkerDetailItemMenu,
    TrainedModel,
    StatisticalValidation
}
