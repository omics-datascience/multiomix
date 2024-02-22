import React, { useEffect, useRef } from 'react'
import ky from 'ky'
import cytoscape from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Grid } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { GORelationType } from './types'

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

    const initCytoscape = (elements) => {
        cytoscape({
            container: document.getElementById('cy'),
            layout: {
                name: 'grid',
                rows: 2,
                cols: 2
            },
            // userZoomingEnabled: false, // Disable zooming
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
            // elements: {
            //     nodes: [
            //         { data: { id: 'j', name: 'Jerry' } },
            //         { data: { id: 'e', name: 'Elaine' } },
            //         { data: { id: 'k', name: 'Kramer' } },
            //         { data: { id: 'g', name: 'George' } }
            //     ],
            //     edges: [
            //         { data: { source: 'j', target: 'e', relation_type: 'prueba' } },
            //         { data: { source: 'j', target: 'k' } },
            //         { data: { source: 'j', target: 'g' } },
            //         { data: { source: 'e', target: 'j' } },
            //         { data: { source: 'e', target: 'k' } },
            //         { data: { source: 'k', target: 'j' } },
            //         { data: { source: 'k', target: 'e' } },
            //         { data: { source: 'k', target: 'g' } },
            //         { data: { source: 'g', target: 'j' } }
            //     ]
            // }
        })
    }

    const getTerms = (goId: string) => {
        // TODO: type request struct
        const searchParams = { term_id: goId, general_depth: 5 }
        ky.get(urlGOTermToTerms, { searchParams, signal: abortControllerTerm.current.signal }).then((response) => {
            response.json().then((data /* TODO: type */) => {
                console.log('Data ->', data) // TODO: remove
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
        // TODO: type request struct
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
