import { DjangoTag } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'

/** Possible types of a Biomarker. */
enum BiomarkerType {
    MRNA = 1,
    MIRNA = 2,
    CNA = 3,
    METHYLATION = 4,
    HETEROGENEOUS = 5
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

export { Biomarker, BiomarkerType }
