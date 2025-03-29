import React, { useEffect, useRef } from 'react'
import ky from 'ky'
import cytoscape from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Form, Grid, Input } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ExternalLink } from '../../../../common/ExternalLink'

// Styles
import '../../../../../css/cytoscape.css'

// Defined in biomarkers.html
declare const urlGeneAssociationsNetwork: string

/** Colors for the String standard: https://string-db.org/cgi/help ("Network" section). */
const COLORS_BY_STRING_RELATION = {
    fusion: ['Fusion', '#d90429'],
    coOccurrence: ['Co-occurrence', '#3a86ff'],
    experimental: ['Experimental', '#7209b7'],
    textMining: ['Text mining', '#d5ae5d'],
    database: ['Database', '#4cc9f0'],
    coExpression: ['Co-expression', '#10002b'] // In the FAQ says 'white', but we have a white background, so it's not visible
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
                {Object.entries(COLORS_BY_STRING_RELATION).map(([_, [relationDescription, color]]) => (
                    <li key={relationDescription}><span style={{ backgroundColor: color }} />{relationDescription}</li>
                ))}
            </ul>
        </div>
    </div>
)

/** GeneAssociationsNetworkPanel props. */
interface GeneAssociationsNetworkPanelProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedGene: BiomarkerMolecule,
}

export const GeneAssociationsNetworkPanel = (props: GeneAssociationsNetworkPanelProps) => {
    const abortControllerTerm = useRef(new AbortController())
    const [minCombinedScore, setMinCombinedScore] = React.useState(950)

    /**
     * Initializes the Cytoscape instance with the given elements.
     * @param elements Cytoscape elements to initialize the instance.
     */
    const initCytoscape = (elements: any /* TODO: type */) => {
        const cy = cytoscape({
            container: document.getElementById('cy'),
            minZoom: 0.5,
            maxZoom: 1.5,
            randomize: true,
            animate: true,
            nodeSpacing: 15,
            edgeLengthVal: 45,
            style: [
                {
                    selector: 'core',
                    style: {
                        'selection-box-color': '#AAD8FF',
                        'selection-box-border-color': '#8BB0D0',
                        'selection-box-opacity': '0.5'
                    }
                },
                {
                    selector: 'node',
                    style: {
                        width: 'mapData(score, 0, 0.006769776522008331, 20, 60)',
                        height: 'mapData(score, 0, 0.006769776522008331, 20, 60)',
                        content: 'data(name)',
                        'font-size': '12px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'background-color': '#555',
                        'text-outline-color': '#555',
                        'text-outline-width': '2px',
                        color: '#fff',
                        'overlay-padding': '6px',
                        'z-index': '10'
                    }
                },
                {
                    selector: 'node[?attr]',
                    style: {
                        shape: 'rectangle',
                        'background-color': '#aaa',
                        'text-outline-color': '#aaa',
                        width: '16px',
                        height: '16px',
                        'font-size': '6px',
                        'z-index': '1'
                    }
                },
                {
                    selector: 'node[?query]',
                    style: {
                        'background-clip': 'none',
                        'background-fit': 'contain'
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': '6px',
                        'border-color': '#AAD8FF',
                        'border-opacity': '0.5',
                        'background-color': '#77828C',
                        'text-outline-color': '#77828C'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'curve-style': 'haystack',
                        'haystack-radius': '0.5',
                        opacity: '0.4',
                        'line-color': '#bbb',
                        width: 'mapData(weight, 0, 1, 1, 8)',
                        'overlay-padding': '3px'
                    }
                },
                {
                    selector: 'node.unhighlighted',
                    style: {
                        opacity: '0.2'
                    }
                },
                {
                    selector: 'edge.unhighlighted',
                    style: {
                        opacity: '0.05'
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'z-index': '999999'
                    }
                },
                {
                    selector: 'node.highlighted',
                    style: {
                        'border-width': '6px',
                        'border-color': '#AAD8FF',
                        'border-opacity': '0.5',
                        'background-color': '#394855',
                        'text-outline-color': '#394855'
                    }
                },
                {
                    selector: 'edge.filtered',
                    style: {
                        opacity: '0'
                    }
                },
                // Types of relations
                {
                    selector: 'edge[group="fusion"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.fusion[1]
                    }
                },
                {
                    selector: 'edge[group="coOccurrence"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.coOccurrence[1]
                    }
                },
                {
                    selector: 'edge[group="experimental"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.experimental[1]
                    }
                },
                {
                    selector: 'edge[group="textMining"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.textMining[1]
                    }
                },
                {
                    selector: 'edge[group="database"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.database[1]
                    }
                },
                {
                    selector: 'edge[group="coExpression"]',
                    style: {
                        'line-color': COLORS_BY_STRING_RELATION.coExpression[1]
                    }
                }
            ],
            elements
        })

        const layout = cy.elements().layout({
            name: 'random'
        })

        layout.run()
    }

    /**
     * Gets all the related genes to the given gene.
     * @param selectedGene Gene object.
     */
    const getRelatedGenes = (selectedGene: BiomarkerMolecule) => {
        const searchParams = { gene_id: selectedGene.identifier, min_combined_score: minCombinedScore }

        ky.get(urlGeneAssociationsNetwork, { searchParams: searchParams as any, signal: abortControllerTerm.current.signal }).then((response) => {
            response.json().then((data: { data: any /* TODO: type */ }) => {
                // The response is a CytoscapeElements object already
                initCytoscape(data.data)
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
        getRelatedGenes(props.selectedGene)
    }, [props.selectedGene])

    /** On unmount, cancels the request */
    useEffect(() => {
        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortControllerTerm.current.abort()
        }
    }, [])

    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={3}>
                    <Form>
                        <Form.Field>
                            <label>Min combined score</label>
                            <Input
                                type='number'
                                value={minCombinedScore}
                                min={900}
                                max={1000}
                                // TODO: implement with debounce
                                onChange={(_e, { value }) => setMinCombinedScore(Number(value))}
                            />
                        </Form.Field>
                    </Form>
                </Grid.Column>
                <Grid.Column width={1} verticalAlign='middle'>
                    <InfoPopup
                        content={
                            <span>
                                The combined score is computed by combining the probabilities from the different evidence channels and corrected for the probability of randomly observing an interaction. For a more detailed description please see <ExternalLink href='https://pubmed.ncbi.nlm.nih.gov/15608232/'>von Mering, et al. Nucleic Acids Res. 2005</ExternalLink>
                            </span>
                        }
                        onTop={false}
                        onEvent='click'
                    />
                </Grid.Column>
                <Grid.Column width={12}>
                    <CytoscapeLegends />

                    <div id='cy' />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
