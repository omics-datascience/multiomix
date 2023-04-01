import { DjangoTag } from '../../utils/django_interfaces'
import { Nullable, Source } from '../../utils/interfaces'

/** Possible types of a Biomarker. */
enum BiomarkerType {
    MRNA = 'mRNA',
    MIRNA = 'miRNA',
    CNA = 'CNA',
    METHYLATION = 'Methylation',
}

enum BiomarkerTypeSelected {
    BASE,
    MANUAL,
    FEATURE_SELECTION,
}

enum MoleculesTypeOfSelection {
    INPUT = 'input',
    AREA = 'area',
}

// TODO: attributes 'number_of_...' only are used in API GET service, not in the form, define and use
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
}

/** Clustering metric to optimize. */
enum ClusteringMetric {
    COX_REGRESSION = 1,
    LOG_RANK_TEST = 2
}

/** SVM's kernel */
enum SvmKernel {
    LINEAR = 1,
    POLYNOMIAL = 2,
    RBF = 3,
}

/** Task to execute with survival SVM. */
enum SvmTask {
    RANKING = 1,
    REGRESSION = 2
}

/** Settings for the Clustering fitness function. */
interface FitnessFunctionClustering{
    parameters: ClusteringAlgorithm
    selection: ClusteringMetric
}

/** Settings for the SVM fitness function. */
interface FitnessFunctionSvm{
    parameters: SvmKernel
    selection: SvmTask
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
type SourceStateBiomarker = 'clinicalSource' | 'mRNASource' | 'mirnaSource' | 'methylationSource' | 'cnaSource'

export {
    SvmKernel,
    SvmTask,
    FitnessFunctionSvm,
    FitnessFunctionClustering,
    FitnessFunctionParameters,
    FitnessFunction,
    FeatureSelectionAlgorithm,
    ClusteringMetric,
    ClusteringAlgorithm,
    SourceStateBiomarker,
    FeatureSelectionPanelData,
    BiomarkerTypeSelected,
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
    MoleculesSymbolFinder
}
