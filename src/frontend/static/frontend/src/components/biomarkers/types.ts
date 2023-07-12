import { DjangoTag } from '../../utils/django_interfaces'
import { MoleculeType, Nullable, Source } from '../../utils/interfaces'
import { KaplanMeierData } from '../pipeline/experiment-result/gene-gem-details/survival-analysis/KaplanMeierUtils'

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
    REACHED_ATTEMPTS_LIMIT = 8,
    NO_FEATURES_FOUND = 9,
    NO_VALID_SAMPLES = 10,
    NO_VALID_MOLECULES = 11
}

/** All the possible states of a TrainedModel. */
enum TrainedModelState {
    COMPLETED = 1,
    FINISHED_WITH_ERROR = 2,
    IN_PROCESS = 3,
    WAITING_FOR_QUEUE = 4,
    NO_SAMPLES_IN_COMMON = 5,
    STOPPING = 6,
    STOPPED = 7,
    REACHED_ATTEMPTS_LIMIT = 8,
    NO_FEATURES_FOUND = 9,
    NO_BEST_MODEL_FOUND = 10,
    NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS = 11,
    /** This could happen for a serialization error in the Spark job. */
    MODEL_DUMP_NOT_AVAILABLE = 12

}

/** Type of molecules input in the Biomarker creation form. */
enum MoleculesTypeOfSelection {
    INPUT = 'input',
    AREA = 'area',
}

/** Structure to create/update a molecule in a Biomarker. */
type SaveMoleculeStructure = {
    id?: number, // If undefined it means it's a new molecule. If present, then the molecule instance is updated
    identifier: string
}

// TODO: attributes 'number_of_...', 'state' and 'origin' only are used in API GET service, not in the form, define and use
// TODO: two different interfaces
/** Common fields of different Biomarker structures (from different endpoints). */
interface BiomarkerSimple {
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
    /** Indicates if the Biomarker was used for an Inference experiment, Statistical Validation or Trained Model. */
    was_already_used: boolean,
    origin: BiomarkerOrigin,
    state: BiomarkerState,
    contains_nan_values: boolean,
    column_used_as_index: string
}

/** Django Biomarker model. */
interface Biomarker extends BiomarkerSimple {
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

interface ValidationSection {
    haveAmbiguous: boolean,
    haveInvalid: boolean,
    isLoading: boolean,
    checkBox: boolean,
}

/** Structure to handle the new Biomarker form. */
interface FormBiomarkerData {
    id: Nullable<number>,
    biomarkerName: string,
    biomarkerDescription: string,
    canEditMolecules: boolean,
    tag: any, // WIP
    moleculeSelected: BiomarkerType,
    moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT | MoleculesTypeOfSelection.AREA,
    moleculesSection: MoleculesSection,
    validation: ValidationSection
    moleculesSymbolsFinder: MoleculesSymbolFinder,
}

interface MoleculesMultipleSelection {
    key: number;
    text: string;
    value: number;
}

/**
 * Generic struct for the MRNAIdentifier, MiRNAIdentifier, CNAIdentifier,
 * and MethylationIdentifier Django models.
 */
type BiomarkerMolecule = {
    id: number,
    identifier: string,
    type: MoleculeType
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

/** Represents a section in the form to create a Biomarker. */
interface MoleculesSectionData {
    isValid: boolean,
    value: string | string[],
}

/** Represents the state of a request to get molecules information during Biomarkers creation. */
interface MoleculeSectionItem {
    isLoading: boolean,
    data: MoleculesSectionData[]
}

/** Represents the state of a request to get molecules information during Biomarkers creation for all the types of molecules. */
type MoleculesSection = {
    [BiomarkerType.CNA]: MoleculeSectionItem,
    [BiomarkerType.MIRNA]: MoleculeSectionItem,
    [BiomarkerType.METHYLATION]: MoleculeSectionItem,
    [BiomarkerType.MRNA]: MoleculeSectionItem,
}

/** Available Feature Selection algorithms. */
enum FeatureSelectionAlgorithm {
    BLIND_SEARCH = 1,
    COX_REGRESSION = 2,
    BBHA = 3,
    PSO = 4
}

/** Available fitness functions. TODO: rename to ModelUsed */
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

/** Common fields in a model. */
interface ModelParameters {
    randomState: Nullable<number>
}

/** Parameters for a Clustering model. */
interface ClusteringParameters extends ModelParameters {
    algorithm: ClusteringAlgorithm,
    /** Metric to optimize during clustering. */
    metric: ClusteringMetric,
    /** Scoring method to use in case of metric === Cox-Regression. */
    scoringMethod: ClusteringScoringMethod,
    /** Number of clusters. */
    nClusters: number,
    /**
     * Penalizer parameter for CoxPHFitter to prevent errors with some small datasets (or ones with high collinearity).
     * Read more at: https://lifelines.readthedocs.io/en/latest/Examples.html#problems-with-convergence-in-the-cox-proportional-hazard-model
     */
    penalizer: number,
    /**
     * If true, the algorithm will look for the optimal number of clusters during a new TrainedModel request.
     * (Used only in the TrainedModel panel)
     */
    lookForOptimalNClusters: boolean,
}

/** Parameters for a Survival SVM model. */
interface SVMParameters extends ModelParameters {
    kernel: SVMKernel
    task: SVMTask,
    maxIterations: number,
}

/** Parameters for a Survival Random Forest model. */
interface RFParameters extends ModelParameters {
    /** Number of trees in the RF. */
    nEstimators: number,
    /** The maximum depth of the tree. If None, then nodes are expanded until all leaves are pure or
    until all leaves contain less than min_samples_split samples. */
    maxDepth: Nullable<number>,
    /**
     * If true, the algorithm will look for the optimal number of trees during a new TrainedModel request.
     * (Used only in the TrainedModel panel)
     */
    lookForOptimalNEstimators: boolean,
}

/** All the different fitness functions' parameters. */
interface FitnessFunctionParameters {
    clusteringParameters: ClusteringParameters,
    svmParameters: SVMParameters,
    rfParameters: RFParameters
}

/** CV parameters. */
interface CrossValidationParameters {
    folds: number
}

/** Structure for the Feature Selection panel. */
interface FeatureSelectionPanelData {
    /** Current Step in the panel. */
    step: number;
    /** Biomarker instance to optimize with Feature Selection. */
    biomarker: Nullable<Biomarker>;
    /** Selected Biomarker instance in the Biomarkers table to show as active. */
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
    /** Advance algorithm to make Feature Selection */
    advancedAlgorithmParameters: AdvancedAlgorithm,
    /** Fitness function to optimize in the algorithm. */
    fitnessFunction: FitnessFunction,
    /** Parameters of the selected `fitnessFunction`. */
    fitnessFunctionParameters: FitnessFunctionParameters,
    crossValidationParameters: CrossValidationParameters,
}

/** Advanced algorithm parameters to make Feature selection */
interface AdvancedAlgorithm {
    isActive: boolean,
    BBHA: AdvancedBBHA,
    coxRegression: AdvancedCoxRegression
}

/** Some common fields to use in the Expert mode. */
interface AdvancedMode {
    /** Try to optimize using Spark if the integration is enabled in the backend. */
    useSpark: boolean
}

/** Advanced Cox Regression properties */
interface AdvancedCoxRegression extends AdvancedMode {
    topN: number
}

/** Advanced BBHA properties */
interface AdvancedBBHA extends AdvancedMode {
    numberOfStars: number;
    numberOfIterations: number;
    BBHAVersion: BBHAVersion;
}

/** Binary Black Hole Algorithm version */
enum BBHAVersion {
    ORIGINAL = 1,
    IMPROVED = 2
}

/** Available types of Sources for a Biomarker. */
type SourceStateBiomarker = 'clinicalSource' | 'mRNASource' | 'mirnaSource' | 'methylationSource' | 'cnaSource'

/** Available options for the Menu in the Biomarker details modal */
enum ActiveBiomarkerDetailItemMenu {
    MOLECULES_DETAILS,
    FEATURE_SELECTION_SUMMARY,
    MODELS,
    STATISTICAL_VALIDATION,
    INFERENCE
}

/** Available options for the Menu in the StatisticalValidation details modal */
enum ActiveStatValidationsItemMenu {
    BEST_FEATURES,
    KAPLAN_MEIER,
    HEATMAP
}

/** Available options for the Menu in the BiomarkerMolecules details modal */
enum ActiveBiomarkerMoleculeItemMenu {
    DETAILS,
    PATHWAYS,
    GENE_ONTOLOGY
}

/** Django TrainedModel model. */
interface TrainedModel {
    id: number,
    name: string,
    description: string,
    state: TrainedModelState,
    fitness_function: FitnessFunction,
    created: string,
    fitness_metric: Nullable<string>,
    best_fitness_value: Nullable<number>
}

/**
 * Represents a connection between a source and a statistical validation result. Useful to show a result for
 * every type of molecule in a Biomarker.
 */
interface StatisticalValidationSourceResult {
    id: number,
    mean_squared_error: Nullable<number>,
    c_index: Nullable<number>,
    cox_c_index: Nullable<number>,
    cox_log_likelihood: Nullable<number>,
    r2_score: Nullable<number>,
}

/** A statistical validation of a Biomarker with few fields. */
interface BasicStatisticalValidation {
    id: number,
    name: string,
    state: BiomarkerState,
    description: Nullable<string>,
    created: string,
}

/** A statistical validation. Retrieved as data for the StatisticalValidationsTable. */
interface StatisticalValidationForTable extends BasicStatisticalValidation {
    fitness_function: FitnessFunction,
    trained_model: Nullable<number>,
}

/** A statistical validation of a Biomarker. */
interface StatisticalValidation extends BasicStatisticalValidation {
    mean_squared_error: Nullable<number>,
    c_index: Nullable<number>,
    cox_c_index: Nullable<number>,
    cox_log_likelihood: Nullable<number>,
    r2_score: Nullable<number>,
}

/** A statistical validation of a Biomarker to submit to the backend. */
interface StatisticalValidationForm extends StatisticalValidation {
    clinical_source: Nullable<StatisticalValidationSourceResult>,
    mrna_source_result: Nullable<StatisticalValidationSourceResult>,
    mirna_source_result: Nullable<StatisticalValidationSourceResult>,
    cna_source_result: Nullable<StatisticalValidationSourceResult>,
    methylation_source_result: Nullable<StatisticalValidationSourceResult>,
}

/** Django InferenceExperiment model. */
interface InferenceExperimentForTable {
    id: number,
    name: string,
    state: BiomarkerState,
    model: FitnessFunction,
    description: Nullable<string>,
    trained_model: Nullable<number>,
    clinical_source_id: Nullable<number>
    created: string
}

/** Django MoleculeWithCoefficient model. */
interface MoleculeWithCoefficient {
    id: number,
    identifier: string,
    coeff: number,
    type: MoleculeType
}

/** Dict from the backend with all the molecules expressions for all the samples. */
interface MoleculesExpressions {
    /** Object with the molecule's name as key. The value is an object with the sample as key, and the expression as value. */
    data: {
        [moleculeName: string]: {
            [sampleName: string]: number // This number is the expression
        }
    },
    min: number,
    max: number
}

/** Common struct for `SampleAndCluster` and `SampleAndTime`. */
interface SampleLabel {
    /** Sample identifier. */
    sample: string,
    /** Color to show in the samples table. */
    color: Nullable<string>
}

/** The sample identifier, and the cluster where it belongs. */
interface SampleAndCluster extends SampleLabel {
    /** Cluster in which the sample was classified. */
    cluster: string
}

/** The sample identifier, and the predicted hazard/survival time. */
interface SampleAndTime extends SampleLabel {
    /** Predicted hazard/survival time. */
    prediction: number
}

/** Data to show in the StatisticalValidation KaplanMeier panel. */
interface KaplanMeierResultData {
    /** Clusters of the clustering algorithm with the corresponding survival function. */
    groups: KaplanMeierData,
    concordance_index: number,
    log_likelihood: number
}

/** Data which is present in all the TrainedModels. */
interface GeneralModelDetails {
    best_fitness: number,
    model: FitnessFunction
    random_state: Nullable<number>
}

/** Some details of Clustering models. */
interface ClusteringModelDetails extends GeneralModelDetails {
    algorithm: ClusteringAlgorithm,
    scoring_method: ClusteringScoringMethod,
    n_clusters: number
}

/** Some details of Clustering models. */
interface SVMModelDetails extends GeneralModelDetails {
    task: SVMTask,
    kernel: SVMKernel,
}

/** Some details of Clustering models. */
interface RFModelDetails extends GeneralModelDetails {
    n_estimators: number,
    max_depth: Nullable<number>
}

/** Types of models details. */
type ModelDetails = ClusteringModelDetails | SVMModelDetails | RFModelDetails

/** Django ClusterLabel model. */
interface ClusterLabel {
    id?: number,
    label: string,
    color: string,
    cluster_id: number
}

/** Django ClusterLabelsSet model. */
interface ClusterLabelsSet {
    id?: number,
    name: string,
    description: string,
    trained_model: number // PK of the TrainedModel
    labels: ClusterLabel[]
}

/** Django ClusterLabel model. */
interface PredictionRangeLabel {
    id?: number,
    label: string,
    color: string,
    min_value: number,
    max_value: Nullable<number>
}

/** Django PredictionRangeLabelsSet model. */
interface PredictionRangeLabelsSet {
    id?: number,
    name: string,
    description: string,
    trained_model: number // PK of the TrainedModel
    labels: PredictionRangeLabel[]
}

export {
    AdvancedCoxRegression,
    AdvancedBBHA,
    BBHAVersion,
    AdvancedAlgorithm,
    SVMKernel,
    SVMTask,
    SVMParameters,
    ClusteringParameters,
    FitnessFunctionParameters,
    CrossValidationParameters,
    FitnessFunction,
    FeatureSelectionAlgorithm,
    ClusteringMetric,
    ClusteringAlgorithm,
    SourceStateBiomarker,
    FeatureSelectionPanelData,
    BiomarkerOrigin,
    BiomarkerState,
    TrainedModelState,
    BiomarkerMolecule,
    SaveMoleculeStructure,
    SaveBiomarkerStructure,
    BiomarkerSimple,
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
    ActiveStatValidationsItemMenu,
    ActiveBiomarkerMoleculeItemMenu,
    TrainedModel,
    BasicStatisticalValidation,
    StatisticalValidationForTable,
    StatisticalValidation,
    StatisticalValidationForm,
    InferenceExperimentForTable,
    MoleculeWithCoefficient,
    MoleculesExpressions,
    KaplanMeierResultData,
    ClusteringModelDetails,
    SVMModelDetails,
    RFModelDetails,
    ModelDetails,
    SampleAndCluster,
    SampleAndTime,
    RFParameters,
    ClusterLabel,
    ClusterLabelsSet,
    PredictionRangeLabel,
    PredictionRangeLabelsSet
}
