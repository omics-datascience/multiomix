import React, { useEffect, useRef } from 'react'
import ky from 'ky'
import cytoscape from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Grid } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { CytoscapeElements, GoTermToTermSearchParams, OntologyRelationTermToTermFilter, OntologyTypeTermToTermFilter } from './types'

// Styles
import '../../../../../css/gene-ontology.css'

// Defined in biomarkers.html
declare const urlGOGeneToTerms: string
declare const urlGOTermToTerms: string

const COLORS_BY_ONTOLOGY_RELATION = {
    [OntologyRelationTermToTermFilter.HAS_PART]: ['Has part', '#e87725'],
    [OntologyRelationTermToTermFilter.IS_A]: ['Is a', '#999'],
    [OntologyRelationTermToTermFilter.PART_OF]: ['Part of', '#4d25e8'],
    [OntologyRelationTermToTermFilter.REGULATES]: ['Regulates', '#d5ae5d']
}

/**
 * Renders the legends for the Cytoscape instance.
 * @returns Component.
 */
const CytoscapeLegends = () => (
    <div className='cytoscape-legends'>
        <div className='legend-title'>Relations</div>
        <div className='legend-scale'>
            <ul className='legend-labels' id="legend">
                {Object.entries(COLORS_BY_ONTOLOGY_RELATION).map(([_, [relationDescription, color]]) => (
                    <li key={relationDescription}><span style={{ backgroundColor: color }}></span>{relationDescription}</li>
                ))}
            </ul>
        </div>
    </div>
)

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
                            const relationType: OntologyRelationTermToTermFilter = edge.data('relation_type')

                            // Checks if it's in the dict
                            if (relationType in COLORS_BY_ONTOLOGY_RELATION) {
                                return COLORS_BY_ONTOLOGY_RELATION[relationType][1]
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
        // TODO: get these values from form
        const relationsStr = [OntologyRelationTermToTermFilter.PART_OF, OntologyRelationTermToTermFilter.REGULATES, OntologyRelationTermToTermFilter.HAS_PART].join(',')
        const ontologyTypeStr = [OntologyTypeTermToTermFilter.BIOLOGICAL_PROCESS, OntologyTypeTermToTermFilter.MOLECULAR_FUNCTION, OntologyTypeTermToTermFilter.CELLULAR_COMPONENT].join(',')

        const searchParams: GoTermToTermSearchParams = {
            term_id: goId,
            relations: relationsStr,
            ontology_type: ontologyTypeStr,
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
                    <CytoscapeLegends />
                    <div id="cy"></div>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
