import React, { useEffect, useRef } from 'react'
import ky from 'ky'
import cytoscape from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Form, Grid, Input } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'

// Styles
import '../../../../../css/gene-ontology.css'
import { CytoscapeElements } from '../gene-ontology/types'

// Defined in biomarkers.html
declare const urlGeneAssociationsNetwork: string

/** GeneAssociationsNetworkPanel props. */
interface GeneAssociationsNetworkPanelProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedGene: BiomarkerMolecule,
}

export const GeneAssociationsNetworkPanel = (props: GeneAssociationsNetworkPanelProps) => {
    const abortControllerTerm = useRef(new AbortController())
    const [minCombinedScore, setMinCombinedScore] = React.useState(500)

    /**
     * Initializes the Cytoscape instance with the given elements.
     * @param elements Cytoscape elements to initialize the instance.
     */
    const initCytoscape = (elements: CytoscapeElements) => {
        cytoscape({
            container: document.getElementById('cy'),
            minZoom: 0.5,
            maxZoom: 1.5,
            layout: {
                name: 'grid',
                rows: 2,
                cols: 2
            },
            style: [{
                selector: 'core',
                style: {
                    'selection-box-color': '#AAD8FF',
                    'selection-box-border-color': '#8BB0D0',
                    'selection-box-opacity': '0.5'
                }
            }, {
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
            }, {
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
            }, {
                selector: 'node[?query]',
                style: {
                    'background-clip': 'none',
                    'background-fit': 'contain'
                }
            }, {
                selector: 'node:selected',
                style: {
                    'border-width': '6px',
                    'border-color': '#AAD8FF',
                    'border-opacity': '0.5',
                    'background-color': '#77828C',
                    'text-outline-color': '#77828C'
                }
            }, {
                selector: 'edge',
                style: {
                    'curve-style': 'haystack',
                    'haystack-radius': '0.5',
                    opacity: '0.4',
                    'line-color': '#bbb',
                    width: 'mapData(weight, 0, 1, 1, 8)',
                    'overlay-padding': '3px'
                }
            }, {
                selector: 'node.unhighlighted',
                style: {
                    opacity: '0.2'
                }
            }, {
                selector: 'edge.unhighlighted',
                style: {
                    opacity: '0.05'
                }
            }, {
                selector: '.highlighted',
                style: {
                    'z-index': '999999'
                }
            }, {
                selector: 'node.highlighted',
                style: {
                    'border-width': '6px',
                    'border-color': '#AAD8FF',
                    'border-opacity': '0.5',
                    'background-color': '#394855',
                    'text-outline-color': '#394855'
                }
            }, {
                selector: 'edge.filtered',
                style: {
                    opacity: '0'
                }
            }, {
                selector: 'edge[group="coexp"]',
                style: {
                    'line-color': '#d0b7d5'
                }
            }, {
                selector: 'edge[group="coloc"]',
                style: {
                    'line-color': '#a0b3dc'
                }
            }, {
                selector: 'edge[group="gi"]',
                style: {
                    'line-color': '#90e190'
                }
            }, {
                selector: 'edge[group="path"]',
                style: {
                    'line-color': '#9bd8de'
                }
            }, {
                selector: 'edge[group="pi"]',
                style: {
                    'line-color': '#eaa2a2'
                }
            }, {
                selector: 'edge[group="predict"]',
                style: {
                    'line-color': '#f6c384'
                }
            }, {
                selector: 'edge[group="spd"]',
                style: {
                    'line-color': '#dad4a2'
                }
            }, {
                selector: 'edge[group="spd_attr"]',
                style: {
                    'line-color': '#D0D0D0'
                }
            }, {
                selector: 'edge[group="reg"]',
                style: {
                    'line-color': '#D0D0D0'
                }
            }, {
                selector: 'edge[group="reg_attr"]',
                style: {
                    'line-color': '#D0D0D0'
                }
            }, {
                selector: 'edge[group="user"]',
                style: {
                    'line-color': '#f0ec86'
                }
            }],
            elements: [{
                data: {
                    id: '605755',
                    idInt: 605755,
                    name: 'PCNA',
                    score: 0.006769776522008331,
                    query: true,
                    gene: true
                },
                // position: {
                //     x: 481.0169597039117,
                //     y: 384.8210888234145
                // },
                group: 'nodes',
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                classes: 'fn10273 fn6944 fn9471 fn10569 fn8023 fn6956 fn6935 fn8147 fn6939 fn6936 fn6629 fn7928 fn6947 fn8612 fn6957 fn8786 fn6246 fn9367 fn6945 fn6946 fn10024 fn10022 fn6811 fn9361 fn6279 fn6278 fn8569 fn7641 fn8568 fn6943'
            }, {
                data: {
                    id: '611408',
                    idInt: 611408,
                    name: 'FEN1',
                    score: 0.006769776522008331,
                    query: false,
                    gene: true
                },
                // position: {
                //     x: 531.9740635094307,
                //     y: 464.8210898234145
                // },
                group: 'nodes',
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                classes: 'fn10273 fn6944 fn9471 fn6284 fn6956 fn6935 fn8147 fn6939 fn6936 fn6949 fn6629 fn7952 fn6680 fn6957 fn8786 fn6676 fn10713 fn7495 fn7500 fn9361 fn6279 fn6278 fn8569 fn7641 fn8568'
            }, {
                data: {
                    id: '612341',
                    idInt: 612341,
                    name: 'RAD9A',
                    score: 0.0028974131563619387,
                    query: false,
                    gene: true
                },
                // position: {
                //     x: 455.8128125018193,
                //     y: 555.4591537139819
                // },
                group: 'nodes',
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                classes: 'fn6935 fn6219 fn6680 fn6676 fn10713 fn7552 fn7495'
            }, {
                data: {
                    id: '608473',
                    idInt: 608473,
                    name: 'RAD9B',
                    score: 0.0026928704785200708,
                    query: false,
                    gene: true
                },
                // position: {
                //     x: 363.1144068403203,
                //     y: 515.7352912086707
                // },
                group: 'nodes',
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                classes: 'fn6935'
            },
            {
                data: {
                    source: '608473',
                    target: '612341',
                    weight: 0.0054105376,
                    group: 'coexp',
                    networkId: 1103,
                    networkGroupId: 18,
                    intn: true,
                    rIntnId: 80,
                    id: 'e78'
                },
                position: {},
                group: 'edges',
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                classes: ''
            }
            ]
        })
    }

    /**
     * Gets all the related genes to the given gene.
     * @param selectedGene Gene object.
     */
    const getRelatedGenes = (selectedGene: BiomarkerMolecule) => {
        const searchParams = { gene_id: selectedGene.identifier, min_combined_score: minCombinedScore }

        ky.get(urlGeneAssociationsNetwork, { searchParams: searchParams as any, signal: abortControllerTerm.current.signal }).then((response) => {
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
                            <label>Min Combined Score</label>
                            <Input
                                type='number'
                                value={minCombinedScore}
                                min={1}
                                max={1000}
                                // TODO: implement with debounce
                                onChange={(_e, { value }) => setMinCombinedScore(Number(value))}
                            />
                        </Form.Field>
                    </Form>
                </Grid.Column>
                <Grid.Column width={13}>
                    <div id="cy"></div>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
