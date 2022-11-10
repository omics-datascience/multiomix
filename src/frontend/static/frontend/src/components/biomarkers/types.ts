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

/** Django Biomarker model. */
interface Biomarker {
    id: Nullable<number>,
    name: string,
    // TODO: complete
}

interface MoleculesMultipleSelection {
    key: number;
    text: string;
    value: number;
}

interface FormBiomarkerData {
    biomarkerName: string,
    biomarkerDescription: string,
    tag: any,
    moleculeSelected: BiomarkerType,
    molecule: number,
    moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT | MoleculesTypeOfSelection.AREA,
    moleculesSection: MoleculesSection,
    genesSymbolsFinder: {
        key: string,
        text: string,
        value: string
    }[],
}
type MoleculesSection = {
    [BiomarkerType.CNA]: MoleculesSectionData[],
    [BiomarkerType.MIRNA]: MoleculesSectionData[],
    [BiomarkerType.METHYLATION]: MoleculesSectionData[],
    [BiomarkerType.MRNA]: MoleculesSectionData[],
}
interface MoleculesSectionData {
    isValid: boolean,
    value: string | string[],
}

export { Biomarker, BiomarkerType, FormBiomarkerData, MoleculesTypeOfSelection, MoleculesMultipleSelection, MoleculesSectionData }
