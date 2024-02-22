import React, { useEffect, useRef } from 'react'
import ky from 'ky'
import cytoscape from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Grid } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { CytoscapeElements, GORelationType, GoTermToTermSearchParams, OntologyRelationTermToTermFilter, OntologyTypeTermToTermFilter } from './types'

// Styles
import '../../../../../css/gene-ontology.css'

// Defined in biomarkers.html
declare const urlGOGeneToTerms: string
declare const urlGOTermToTerms: string

/** GeneInformation props. */
interface GeneOntologyPanelProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

export const GeneOntologyPanel = (props: GeneOntologyPanelProps) => {
    const abortController = useRef(new AbortController())
    const abortControllerTerm = useRef(new AbortController())

    /**
     * Initializes the Cytoscape instance with the given elements.
     * @param elements Cytoscape elements to initialize the instance.
     */
    const initCytoscape = (elements: CytoscapeElements) => {
        cytoscape({
            container: document.getElementById('cy'),
            layout: {
                name: 'grid',
                rows: 2,
                cols: 2
            },
            // userZoomingEnabled: false, // Disable zooming. TODO: check this
            style: [
                {
                    selector: 'node[name]',
                    style: {
                        content: 'data(name)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'curve-style': 'bezier',
                        'target-arrow-shape': 'triangle',
                        'line-color': function (edge) {
                            // Sets the color of the edge depending on the relation_type attribute
                            const relationType: GORelationType = edge.data('relation_type')

                            switch (relationType) {
                                case GORelationType.ENABLES:
                                    return 'green'
                                case GORelationType.INVOLVED_IN:
                                    return 'blue'
                                case GORelationType.PART_OF:
                                    return 'purple'
                                case GORelationType.LOCATED_IN:
                                    return 'orange'
                                default:
                                    break
                            }
                        }
                    }
                }
            ],
            elements
        })
    }

    /**
     * Gets all the related terms to the given GO term.
     * @param goId GO term identifier.
     */
    const getTerms = (goId: string) => {
        // TODO: get this values from form
        const searchParams: GoTermToTermSearchParams = {
            term_id: goId,
            relations: [OntologyRelationTermToTermFilter.PART_OF, OntologyRelationTermToTermFilter.REGULATES, OntologyRelationTermToTermFilter.HAS_PART],
            ontology_type: [OntologyTypeTermToTermFilter.BIOLOGICAL_PROCESS, OntologyTypeTermToTermFilter.MOLECULAR_FUNCTION, OntologyTypeTermToTermFilter.CELLULAR_COMPONENT],
            general_depth: 5,
            hierarchical_depth_to_children: 0,
            to_root: 1
        }
        ky.get(urlGOTermToTerms, { searchParams, signal: abortControllerTerm.current.signal }).then((response) => {
            response.json().then((data: { go_terms: CytoscapeElements }) => {
                // The response is a CytoscapeElements object already
                initCytoscape(data.go_terms)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortControllerTerm.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting experiment', err)
        })
    }

    useEffect(() => {
        // TODO: type request struct and get values from form
        const searchParams = {
            gene: props.selectedMolecule.identifier
            // TODO: implement filters
            // filter_type
            // p_value_threshold
            // correction_method
            // relation_type
            // ontology_type
        }
        ky.get(urlGOGeneToTerms, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((data /* TODO: type */) => {
                console.log('Data ->', data) // TODO: remove

                getTerms(data.go_terms[0].go_id) // TODO: implement selection of term in the frontend
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting experiment', err)
        })

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
            abortControllerTerm.current.abort()
        }
    }, [])

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column width={16}>
                    <div id="cy"></div>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
