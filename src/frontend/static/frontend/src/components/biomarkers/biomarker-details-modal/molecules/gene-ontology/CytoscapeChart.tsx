import ky from 'ky'
import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

import { alertGeneralError } from '../../../../../utils/util_functions'
import { OntologyRelationTermToTermFilter, CytoscapeElements, OntologyType, GoTermToTermSearchParams } from './types'
import { Button, Grid } from 'semantic-ui-react'

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

/** CytoscapeLegends props. */
interface CytoscapeLegendsProps {
    /** GO id to get the related terms */
    termId: string,
    /** Callback to return to the previous panel. */
    goBack: () => void
}

/**
 * Renders a Cytoscape chart to show the related terms to a given GO term.
 * @param props Component's props.
 * @returns Component.
 */
export const CytoscapeChart = (props: CytoscapeLegendsProps) => {
    const abortControllerTerm = useRef(new AbortController())

    /**
     * Initializes the Cytoscape instance with the given elements.
     * @param elements Cytoscape elements to initialize the instance.
     */
    const initCytoscape = (elements: CytoscapeElements) => {
        cytoscape({
            container: document.getElementById('cy'),
            minZoom: 0.3,
            maxZoom: 1.5,
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
        const ontologyTypeStr = [OntologyType.BIOLOGICAL_PROCESS, OntologyType.MOLECULAR_FUNCTION, OntologyType.CELLULAR_COMPONENT].join(',')

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
        getTerms(props.termId)
    }, [props.termId])

    /** On unmount, cancels the request */
    useEffect(() => {
        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortControllerTerm.current.abort()
        }
    }, [])

    return (
        <Grid.Row columns={2}>
            <Grid.Column width={3}>
                {/* Go back button. */}
                <Button onClick={props.goBack} icon='arrow left' content='Go back' />
            </Grid.Column>
            <Grid.Column width={13}>
                <CytoscapeLegends />
                <div id="cy"></div>
            </Grid.Column>
        </Grid.Row>
    )
}
