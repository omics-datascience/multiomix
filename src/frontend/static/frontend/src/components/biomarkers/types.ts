import { Nullable } from '../../utils/interfaces'

/** Possible types of a Biomarker. */
enum BiomarkerType {
    MRNA = 1,
    MIRNA = 2,
    CNA = 3,
    METHYLATION = 4,
    HETEROGENEOUS = 5
}

/** Django Biomarker model. */
interface Biomarker {
    id: Nullable<number>,
    name: string,
    // TODO: complete
}

export { Biomarker, BiomarkerType }
