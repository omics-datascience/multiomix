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

/** Cytoscape edge type with. */
type CytoscapeEdge = CytoscapeElement & {
    data: {
        source: string
        target: string
        relation_type: GORelationType
    }
}

/** Cytoscape `elements` prop type. */
type CytoscapeElements = {
    nodes: CytoscapeElement[]
    edges: CytoscapeEdge[]
}

/** All possible relations between Gene Ontology terms in the request. */
enum OntologyRelationTermToTermFilter {
    PART_OF = 'part_of',
    REGULATES = 'regulates',
    HAS_PART = 'has_part',
}

/** All possible ontologies types between Gene Ontology terms in the request. */
enum OntologyTypeTermToTermFilter {
    BIOLOGICAL_PROCESS = 'biological_process',
    MOLECULAR_FUNCTION = 'molecular_function',
    CELLULAR_COMPONENT = 'cellular_component',
}

/** Params for the "Gene Ontology terms related to another specific term" BioAPI service. */
type GoTermToTermSearchParams = {
    term_id: string,
    relations: OntologyRelationTermToTermFilter[],
    ontology_type: OntologyTypeTermToTermFilter[],
    general_depth: number,
    hierarchical_depth_to_children: number,
    to_root: 0 | 1,
}

export {
    GORelationType,
    CytoscapeElements,
    OntologyRelationTermToTermFilter,
    OntologyTypeTermToTermFilter,
    GoTermToTermSearchParams
}
