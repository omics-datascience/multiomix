import React, { useEffect, useRef, useState } from 'react'
import ky from 'ky'
import cytoscape, {
    Core,
    ElementDefinition,
    EventObjectNode,
    NodeSingular
} from 'cytoscape'
import { BiomarkerMolecule } from '../../../types'
import { Form, Grid, Input } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ExternalLink } from '../../../../common/ExternalLink'
import '../../../../../css/cytoscape.css'
import { useIntl } from 'react-intl'

// Defined in biomarkers.html
declare const urlGeneAssociationsNetwork: string

const COLORS_BY_STRING_RELATION = {
    fusion: ['Fusion', '#d90429'],
    coOccurrence: ['Co-occurrence', '#3a86ff'],
    experimental: ['Experimental', '#7209b7'],
    textMining: ['Text mining', '#d5ae5d'],
    database: ['Database', '#4cc9f0'],
    coExpression: ['Co-expression', '#10002b']
} as const

/**
 * Renders the legends for the Cytoscape instance.
 * @returns Component.
 */
const CytoscapeLegends = () => {
    const intl = useIntl()

    return (
        <div className='cytoscape-legends'>
            <div className='legend-title'>
                {intl.formatMessage({ id: 'common.relations' })}
            </div>
            <div className='legend-scale'>
                <ul className='legend-labels' id='legend'>
                    {Object.entries(COLORS_BY_STRING_RELATION).map(([relationKey, [_, color]]) => (
                        <li key={relationKey}>
                            <span style={{ backgroundColor: color }} />
                            {intl.formatMessage({ id: `geneAssociations.relation.${relationKey}` })}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

interface GeneAssociationsNetworkPanelProps {
    selectedGene: BiomarkerMolecule
}

type CytoscapeResponseData =
    | ElementDefinition[]
    | {
        nodes?: ElementDefinition[]
        edges?: ElementDefinition[]
    }

export const GeneAssociationsNetworkPanel = ({ selectedGene }: GeneAssociationsNetworkPanelProps) => {
    const intl = useIntl()
    const cyContainerRef = useRef<HTMLDivElement | null>(null)
    const cyRef = useRef<Core | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const positionsRef = useRef<Record<string, { x: number, y: number }>>({})
    const [minCombinedScore, setMinCombinedScore] = useState(950)

    const cytoscapeStyles = [
        {
            selector: 'core',
            style: {
                'selection-box-color': '#AAD8FF',
                'selection-box-border-color': '#8BB0D0',
                'selection-box-opacity': 0.5
            } as any
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
                'z-index': 10
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
                'z-index': 1
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
                'border-opacity': 0.5,
                'background-color': '#77828C',
                'text-outline-color': '#77828C'
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'haystack',
                'haystack-radius': 0.5,
                opacity: 0.4,
                'line-color': '#bbb',
                width: 'mapData(weight, 0, 1, 1, 8)',
                'overlay-padding': '3px'
            }
        },
        {
            selector: 'node.unhighlighted',
            style: {
                opacity: 0.2
            }
        },
        {
            selector: 'edge.unhighlighted',
            style: {
                opacity: 0.05
            }
        },
        {
            selector: '.highlighted',
            style: {
                'z-index': 999999
            }
        },
        {
            selector: 'node.highlighted',
            style: {
                'border-width': '6px',
                'border-color': '#AAD8FF',
                'border-opacity': 0.5,
                'background-color': '#394855',
                'text-outline-color': '#394855'
            }
        },
        {
            selector: 'edge.filtered',
            style: {
                opacity: 0
            }
        },
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
    ]

    const normalizeElements = (elements: CytoscapeResponseData): ElementDefinition[] => {
        if (Array.isArray(elements)) {
            return elements
        }

        return [...(elements.nodes || []), ...(elements.edges || [])]
    }

    const createCy = () => {
        if (cyRef.current || !cyContainerRef.current) { return }

        const cy = cytoscape({
            container: cyContainerRef.current,
            minZoom: 0.5,
            maxZoom: 1.5,
            elements: [],
            style: cytoscapeStyles,
            layout: {
                name: 'preset'
            }
        })

        cy.on('dragfreeon', 'node', (evt: EventObjectNode) => {
            const node = evt.target
            positionsRef.current[node.id()] = node.position()
        })

        cyRef.current = cy
    }

    const applyElements = (rawElements: CytoscapeResponseData) => {
        const cy = cyRef.current

        if (!cy) { return }

        const incomingElements = normalizeElements(rawElements)

        cy.nodes().forEach((node: NodeSingular) => {
            positionsRef.current[node.id()] = node.position()
        })

        const mergedElements = incomingElements.map((element) => {
            const elementId = element?.data?.id as string | undefined
            const savedPosition = elementId ? positionsRef.current[elementId] : undefined
            const isNode = !('source' in (element.data || {})) && !('target' in (element.data || {}))

            if (isNode && savedPosition) {
                return {
                    ...element,
                    position: savedPosition
                }
            }

            return element
        })

        cy.batch(() => {
            cy.elements().remove()
            cy.add(mergedElements)
        })

        const hasSavedPositions = cy
            .nodes()
            .toArray()
            .some((node: NodeSingular) => Boolean(positionsRef.current[node.id()]))

        if (hasSavedPositions) {
            cy.layout({
                name: 'preset',
                fit: true,
                padding: 30,
                animate: false
            }).run()
        } else {
            cy.layout({
                name: 'cose',
                fit: true,
                padding: 30,
                animate: false,
                randomize: true
            }).run()
        }

        cy.resize()
        cy.fit(undefined, 30)
    }

    const getRelatedGenes = async (gene: BiomarkerMolecule, score: number) => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()

        try {
            const response = await ky.get(urlGeneAssociationsNetwork, {
                searchParams: {
                    gene_id: gene.identifier,
                    min_combined_score: score
                } as any,
                signal: abortControllerRef.current.signal
            })

            const data = await response.json<{ data: CytoscapeResponseData }>()
            applyElements(data.data)
        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting experiment', err)
        }
    }

    useEffect(() => {
        createCy()

        return () => {
            abortControllerRef.current?.abort()
            cyRef.current?.destroy()
            cyRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!cyRef.current) { return }

        getRelatedGenes(selectedGene, minCombinedScore)
    }, [selectedGene, minCombinedScore])

    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={3}>
                    <Form>
                        <Form.Field>
                            <label>{intl.formatMessage({ id: 'geneAssociations.form.minCombinedScore' })}</label>
                            <Input
                                type='number'
                                value={minCombinedScore}
                                min={900}
                                max={1000}
                                onChange={(_e, { value }) => setMinCombinedScore(Number(value))}
                            />
                        </Form.Field>
                    </Form>
                </Grid.Column>

                <Grid.Column width={1} verticalAlign='middle'>
                    <InfoPopup
                        content={(
                            <span>
                                The combined score is computed by combining the probabilities from the different evidence channels and corrected for the probability of randomly observing an interaction. For a more detailed description please see{' '}
                                <ExternalLink href='https://pubmed.ncbi.nlm.nih.gov/15608232/'>
                                    von Mering, et al. Nucleic Acids Res. 2005
                                </ExternalLink>
                            </span>
                        )}
                        onTop={false}
                        onEvent='click'
                    />
                </Grid.Column>

                <Grid.Column width={12}>
                    <CytoscapeLegends />

                    <div
                        id='cy'
                        ref={cyContainerRef}
                        style={{
                            width: '100%',
                            height: '650px',
                            minHeight: '650px',
                            border: '1px solid #ddd',
                            borderRadius: '6px'
                        }}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
