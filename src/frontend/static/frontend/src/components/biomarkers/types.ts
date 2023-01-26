import { DjangoTag } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'

/** Possible types of a Biomarker. */
enum BiomarkerType {
    MRNA = 'MRNA',
    MIRNA = 'MIRNA',
    CNA = 'CNA',
    METHYLATION = 'METHYLATION',
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
    number_of_genes: number,
    number_of_mirnas: number,
    number_of_cnas: number,
    number_of_methylations: number,
    contains_nan_values: boolean,
    column_used_as_index: string
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

interface FormBiomarkerData {
    biomarkerName: string,
    biomarkerDescription: string,
    tag: any, // se esta laburando salu2
    moleculeSelected: BiomarkerType,
    molecule: number,
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
interface SaveBiomarkerStructure {
    name: string,
    description: string,
    mrnas:
    { identifier: string }[],
    mirnas:
    { identifier: string }[],
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

export {
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
