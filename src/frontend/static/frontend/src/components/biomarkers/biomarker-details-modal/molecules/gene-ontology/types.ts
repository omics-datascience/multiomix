/** All Gene Ontology relations returned by BioAPI. */
enum GORelationType {
    ENABLES = 'enables',
    INVOLVED_IN = 'involved_in',
    PART_OF = 'part_of',
    LOCATED_IN = 'located_in'
}

/** Cytoscape element type. */
type CytoscapeElement = {
    data: {
        id: string
        name: string
    }
}

/** All possible relations between Gene Ontology terms in the request. */
enum OntologyRelationTermToTermFilter {
    IS_A = 'is_a',
    PART_OF = 'part_of',
    REGULATES = 'regulates',
    HAS_PART = 'has_part',
}

/** Cytoscape edge type with. */
type CytoscapeEdge = CytoscapeElement & {
    data: {
        source: string
        target: string
        relation_type: OntologyRelationTermToTermFilter
    }
}

/** Cytoscape `elements` prop type. */
type CytoscapeElements = {
    nodes: CytoscapeElement[]
    edges: CytoscapeEdge[]
}

/** All possible ontologies types between Gene Ontology terms in the request. */
enum OntologyType {
    BIOLOGICAL_PROCESS = 'biological_process',
    MOLECULAR_FUNCTION = 'molecular_function',
    CELLULAR_COMPONENT = 'cellular_component',
}

/** Params for the "Gene Ontology terms related to another specific term" BioAPI service. */
type GoTermToTermSearchParams = {
    term_id: string,
    relations: string,
    ontology_type: string,
    general_depth: number,
    hierarchical_depth_to_children: number,
    to_root: 0 | 1,
}

/** Filter type for the "Gene Ontology terms related to a gene" BioAPI service. */
enum GeneToTermFilterType {
    INTERSECTION = 'intersection',
    UNION = 'union',
    ENRICHMENT = 'enrichment'
}

/**
 * Form to filter the "Gene Ontology terms related to a gene" BioAPI service.
 */
interface GeneToTermForm {
    filter_type: GeneToTermFilterType
    /** Used only if filter_type === 'ENRICHMENT' */
    p_value_threshold: number,
    /** Used only if filter_type === 'ENRICHMENT' */
    correction_method: 'analytical' | 'bonferroni' | 'false_discovery_rate'
    relation_type: GORelationType[],
    ontology_type: OntologyType[]
}

/** Final params for the "Gene Ontology terms related to a gene" BioAPI service. */
interface GeneToTermSearchParams extends Omit<GeneToTermForm, 'relation_type' | 'ontology_type'> {
    gene: string,
    relation_type: string, // Needs to be a string to be sent to the backend
    ontology_type: string, // Needs to be a string to be sent to the backend
}

type GeneRelation = {
    /** Evidence code to indicate how the annotation to a particular term is supported. */
    evidence: string,
    /** Gene identifier. */
    gene: string,
    /** The type of relation between the gene and the GO term. When `filter_type` is enrichment, extra relation will be gather from g:Profiler database. These relations will be shown as "relation obtained from gProfiler". */
    relation_type: GORelationType,
}

/** Enrichment metrics for a gene. */
type EnrichmentMetrics = {
    /** Hypergeometric p-value after correction for multiple testing. */
    p_value: number,
    /** The number of genes in the query that are annotated to the corresponding term. */
    intersection_size: number,
    /** The total number of genes "in the universe " which is used as one of the four parameters for the hypergeometric probability function of statistical significance. */
    effective_domain_size: number,
    /** The number of genes that were included in the query. */
    query_size: number,
    /** The number of genes that are annotated to the term. */
    term_size: number,
    /** The proportion of genes in the input list that are annotated to the function. Defined as intersection_size/query_size. */
    precision: number,
    /** The proportion of functionally annotated genes that the query recovers. Defined as intersection_size/term_size. */
    recall: number,
}

/** GO term for a specific gene. */
type GoTerm = {
    /** TODO: complete when Mauri adds the doc in BioAPI repo. */
    alt_id: string[],
    /** A textual description of what the term represents, plus reference(s) to the source of the information. */
    definition: string,
    /** TODO: complete when Mauri adds the doc in BioAPI repo. */
    definition_reference: string,
    /** Unique identifier. */
    go_id: string,
    /** TODO: complete when Mauri adds the doc in BioAPI repo. */
    is_a: string
    /** Human-readable term name. */
    name: string,
    /** Denotes which of the three sub-ontologies (cellular component, biological process or molecular function) the term belongs to. */
    ontology_type: OntologyType,
    relations_to_genes: GeneRelation[],
    /** Indicates that the term belongs to a designated subset of terms. */
    subset: string[],
    /** TODO: complete when Mauri adds the doc in BioAPI repo. */
    synonym: string[],
    enrichment_metrics?: EnrichmentMetrics
}

/** Response of the BioAPI service that returns all the related GO terms for a specific gene. */
type TermsRelatedToGene = {
    go_terms: GoTerm[]
}

export {
    GORelationType,
    CytoscapeElements,
    OntologyRelationTermToTermFilter,
    OntologyType,
    GoTermToTermSearchParams,
    GeneToTermFilterType,
    GeneToTermForm,
    GeneToTermSearchParams,
    GoTerm,
    TermsRelatedToGene
}
