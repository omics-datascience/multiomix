import ky from 'ky'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { debounce } from 'lodash'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { OntologyRelationTermToTermFilter, CytoscapeElements, OntologyType, GoTermToTermSearchParams, GoTermToTermForm } from './types'
import { Button, Form, Grid } from 'semantic-ui-react'

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
            <ul className='legend-labels' id='legend'>
                {Object.entries(COLORS_BY_ONTOLOGY_RELATION).map(([_, [relationDescription, color]]) => (
                    <li key={relationDescription}><span style={{ backgroundColor: color }} />{relationDescription}</li>
                ))}
            </ul>
        </div>
    </div>
)

/** GeneOntologyCytoscapeChart props. */
interface GeneOntologyCytoscapeChartProps {
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
export const GeneOntologyCytoscapeChart = (props: GeneOntologyCytoscapeChartProps) => {
    const abortControllerTerm = useRef(new AbortController())
    const [termsRelatedToTermForm, setTermsRelatedToTermForm] = useState<GoTermToTermForm>({
        relations: [OntologyRelationTermToTermFilter.PART_OF, OntologyRelationTermToTermFilter.REGULATES, OntologyRelationTermToTermFilter.HAS_PART],
        ontology_type: [OntologyType.BIOLOGICAL_PROCESS, OntologyType.MOLECULAR_FUNCTION, OntologyType.CELLULAR_COMPONENT],
        general_depth: 5,
        hierarchical_depth_to_children: 0,
        to_root: 1
    })

    /**
     * Initializes the Cytoscape instance with the given elements.
     * @param elements Cytoscape elements to initialize the instance.
     */
    const initCytoscape = (elements: CytoscapeElements) => {
        const cy = cytoscape({
            container: document.getElementById('cy'),
            minZoom: 0.5,
            maxZoom: 1.5,
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

        // Randomizes nodes positions
        const layout = cy.elements().layout({
            name: 'random'
        })

        layout.run()
    }

    /**
     * Gets all the related terms to the given GO term.
     * @param termId GO term identifier.
     * @param dataForm Form to filter the related terms.
     */
    const getRelatedTerms = (termId: string, dataForm: GoTermToTermForm) => {
        const searchParams: GoTermToTermSearchParams = {
            term_id: termId,
            relations: dataForm.relations.join(','),
            ontology_type: dataForm.ontology_type.join(','),
            general_depth: dataForm.general_depth,
            hierarchical_depth_to_children: dataForm.hierarchical_depth_to_children,
            to_root: dataForm.to_root
        }

        ky.get(urlGOTermToTerms, { searchParams: searchParams as any, signal: abortControllerTerm.current.signal }).then((response) => {
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

    /** Makes the query to Modulector/Bio-API to retrieve terms. */
    const makeRequestCallback = useCallback(
        debounce((termId: string, dataForm: GoTermToTermForm) => {
            getRelatedTerms(termId, dataForm)
        }, 1000),
        []
    )

    /**
     * Handles changes in the form.
     * @param name Name of the input.
     * @param value New value.
     */
    const handleChangesInForm = (name: string, value: any) => {
        setTermsRelatedToTermForm((prev) => {
            const newState = {
                ...prev,
                [name]: value
            }

            // Makes a debounced request
            makeRequestCallback(props.termId, newState)
            return newState
        })
    }

    const handleCheckboxChange = (name: string, value: any) => {
        setTermsRelatedToTermForm((prev) => {
            const newState = {
                ...prev,
                [name]: prev[name].includes(value) ? prev[name].filter((v) => v !== value) : [...prev[name], value]
            }

            // Makes a debounced request
            makeRequestCallback(props.termId, newState)
            return newState
        })
    }

    useEffect(() => {
        getRelatedTerms(props.termId, termsRelatedToTermForm)
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

                {/* Form for termsRelatedToTermForm */}
                <Form className='margin-top-5'>
                    <Form.Field>
                        <label>Relations</label>
                        {Object.entries(OntologyRelationTermToTermFilter)
                            .filter(([_key, value]) => value !== OntologyRelationTermToTermFilter.IS_A)
                            .map(([key, value]) => (
                                <Form.Checkbox
                                    key={key}
                                    label={value}
                                    checked={termsRelatedToTermForm.relations.includes(value)}
                                    onChange={() => handleCheckboxChange('relations', value)}
                                />
                            ))}
                    </Form.Field>
                    <Form.Field>
                        <label>Ontology type</label>
                        {Object.entries(OntologyType).map(([key, value]) => (
                            <Form.Checkbox
                                key={key}
                                label={value}
                                checked={termsRelatedToTermForm.ontology_type.includes(value)}
                                onChange={() => handleCheckboxChange('ontology_type', value)}
                            />
                        ))}
                    </Form.Field>
                    <Form.Input
                        label='General depth'
                        type='number'
                        value={termsRelatedToTermForm.general_depth}
                        onChange={(e) => handleChangesInForm('general_depth', parseInt(e.target.value))}
                    />
                    <Form.Input
                        label='Hierarchical depth to children'
                        type='number'
                        value={termsRelatedToTermForm.hierarchical_depth_to_children}
                        onChange={(e) => handleChangesInForm('hierarchical_depth_to_children', parseInt(e.target.value))}
                    />
                    <Form.Checkbox
                        label='To root'
                        checked={termsRelatedToTermForm.to_root === 1}
                        onChange={() => handleChangesInForm('to_root', termsRelatedToTermForm.to_root === 1 ? 0 : 1)}
                    />
                </Form>
            </Grid.Column>
            <Grid.Column width={13}>
                <CytoscapeLegends />
                <div id='cy' />
            </Grid.Column>
        </Grid.Row>
    )
}
