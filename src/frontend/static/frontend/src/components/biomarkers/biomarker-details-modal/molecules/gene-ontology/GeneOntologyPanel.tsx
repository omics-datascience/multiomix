import React, { useCallback, useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { Form, Grid, Table } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { Nullable } from '../../../../../utils/interfaces'
import { GeneOntologyCytoscapeChart } from './GeneOntologyCytoscapeChart'
import { GORelationType, GeneToTermFilterType, GeneToTermForm, GeneToTermSearchParams, GoTerm, OntologyType, TermsRelatedToGene } from './types'
import { debounce } from 'lodash'

// Styles
import '../../../../../css/cytoscape.css'

// Defined in biomarkers.html
declare const urlGOGeneToTerms: string

/** GeneOntologyPanel props. */
interface GeneOntologyPanelProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

export const GeneOntologyPanel = (props: GeneOntologyPanelProps) => {
    const abortController = useRef(new AbortController())
    const [terms, setTerms] = useState<Nullable<GoTerm[]>>(null)
    const [selectedTerm, setSelectedTerm] = useState<Nullable<string>>(null)
    const [termsRelatedToGeneForm, setTermsRelatedToGeneForm] = useState<GeneToTermForm>({
        filter_type: GeneToTermFilterType.INTERSECTION,
        p_value_threshold: 0.05,
        correction_method: 'analytical',
        relation_type: [GORelationType.ENABLES, GORelationType.INVOLVED_IN, GORelationType.PART_OF, GORelationType.LOCATED_IN],
        ontology_type: [OntologyType.BIOLOGICAL_PROCESS, OntologyType.MOLECULAR_FUNCTION, OntologyType.CELLULAR_COMPONENT]
    })

    /**
     * Gets all the related terms to the selected gene.
     * @param formData Form data to send to the backend.
     */
    const getAllRelatedTerms = (formData: GeneToTermForm) => {
        const searchParams: GeneToTermSearchParams = {
            gene: props.selectedMolecule.identifier,
            filter_type: formData.filter_type,
            p_value_threshold: formData.p_value_threshold,
            correction_method: formData.correction_method,
            relation_type: formData.relation_type.join(','),
            ontology_type: formData.ontology_type.join(',')
        }

        if (searchParams.filter_type === GeneToTermFilterType.ENRICHMENT) {
            searchParams.p_value_threshold = formData.p_value_threshold
            searchParams.correction_method = formData.correction_method
        }

        ky.get(urlGOGeneToTerms, { searchParams: searchParams as any, signal: abortController.current.signal }).then((response) => {
            response.json().then((data: TermsRelatedToGene) => {
                setTerms(data.go_terms)
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
    }

    useEffect(() => {
        getAllRelatedTerms(termsRelatedToGeneForm)

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [])

    /** Makes the query to Modulector/Bio-API to retrieve terms. */
    const makeRequestCallback = useCallback(
        debounce((dataForm: GeneToTermForm) => {
            getAllRelatedTerms(dataForm)
        }, 1000),
        []
    )

    /**
     * Handles changes in the form.
     * @param name Name of the input.
     * @param value New value.
     */
    const handleChangesInForm = (name: string, value: any) => {
        setTermsRelatedToGeneForm((prev) => {
            const newState = {
                ...prev,
                [name]: value
            }

            // Makes a debounced request
            makeRequestCallback(newState)
            return newState
        })
    }

    const handleCheckboxChange = (name: string, value: any) => {
        setTermsRelatedToGeneForm((prev) => {
            const newState = {
                ...prev,
                [name]: prev[name].includes(value) ? prev[name].filter((v) => v !== value) : [...prev[name], value]
            }

            // Makes a debounced request
            makeRequestCallback(newState)
            return newState
        })
    }

    return (
        <Grid>
            {!selectedTerm &&
                <Grid.Row columns={2}>
                    <Grid.Column width={3}>
                        {/* Form for termsRelatedToGeneForm */}
                        <Form>
                            <Form.Group grouped>
                                <Form.Field>
                                    <label>Filter type</label>
                                    <Form.Radio
                                        label='Intersection'
                                        value={GeneToTermFilterType.INTERSECTION}
                                        checked={termsRelatedToGeneForm.filter_type === GeneToTermFilterType.INTERSECTION}
                                        onChange={() => handleChangesInForm('filter_type', GeneToTermFilterType.INTERSECTION)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Radio
                                        label='Union'
                                        value={GeneToTermFilterType.UNION}
                                        checked={termsRelatedToGeneForm.filter_type === GeneToTermFilterType.UNION}
                                        onChange={() => handleChangesInForm('filter_type', GeneToTermFilterType.UNION)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Radio
                                        label='Enrichment'
                                        value={GeneToTermFilterType.ENRICHMENT}
                                        checked={termsRelatedToGeneForm.filter_type === GeneToTermFilterType.ENRICHMENT}
                                        onChange={() => handleChangesInForm('filter_type', GeneToTermFilterType.ENRICHMENT)}
                                    />
                                </Form.Field>
                            </Form.Group>
                            {termsRelatedToGeneForm.filter_type === GeneToTermFilterType.ENRICHMENT &&
                                <>
                                    <Form.Input
                                        label='P-value threshold'
                                        type='number'
                                        value={termsRelatedToGeneForm.p_value_threshold}
                                        onChange={(_e, { value }) => handleChangesInForm('p_value_threshold', value)}
                                    />
                                    <Form.Select
                                        label='Correction method'
                                        options={[
                                            { key: 'analytical', text: 'Analytical', value: 'analytical' },
                                            { key: 'bonferroni', text: 'Bonferroni', value: 'bonferroni' },
                                            { key: 'false_discovery_rate', text: 'False discovery rate', value: 'false_discovery_rate' }
                                        ]}
                                        value={termsRelatedToGeneForm.correction_method}
                                        onChange={(_e, { value }) => handleChangesInForm('correction_method', value)}
                                    />
                                </>}
                            <Form.Group grouped>
                                <Form.Field>
                                    <label>Relation type</label>
                                    <Form.Checkbox
                                        label='Enables'
                                        value={GORelationType.ENABLES}
                                        checked={termsRelatedToGeneForm.relation_type.includes(GORelationType.ENABLES)}
                                        onChange={(_e, { value }) => handleCheckboxChange('relation_type', value)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Checkbox
                                        label='Involved in'
                                        value={GORelationType.INVOLVED_IN}
                                        checked={termsRelatedToGeneForm.relation_type.includes(GORelationType.INVOLVED_IN)}
                                        onChange={(_e, { value }) => handleCheckboxChange('relation_type', value)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Checkbox
                                        label='Part of'
                                        value={GORelationType.PART_OF}
                                        checked={termsRelatedToGeneForm.relation_type.includes(GORelationType.PART_OF)}
                                        onChange={(_e, { value }) => handleCheckboxChange('relation_type', value)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Checkbox
                                        label='Located in'
                                        value={GORelationType.LOCATED_IN}
                                        checked={termsRelatedToGeneForm.relation_type.includes(GORelationType.LOCATED_IN)}
                                        onChange={(_e, { value }) => handleCheckboxChange('relation_type', value)}
                                    />
                                </Form.Field>
                            </Form.Group>
                            <Form.Group grouped>
                                <Form.Field>
                                    <label>Ontology type</label>
                                    <Form.Checkbox
                                        label='Biological process'
                                        value={OntologyType.BIOLOGICAL_PROCESS}
                                        checked={termsRelatedToGeneForm.ontology_type.includes(OntologyType.BIOLOGICAL_PROCESS)}
                                        onChange={(_e, { value }) => handleCheckboxChange('ontology_type', value)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Checkbox
                                        label='Molecular function'
                                        value={OntologyType.MOLECULAR_FUNCTION}
                                        checked={termsRelatedToGeneForm.ontology_type.includes(OntologyType.MOLECULAR_FUNCTION)}
                                        onChange={(_e, { value }) => handleCheckboxChange('ontology_type', value)}
                                    />
                                </Form.Field>
                                <Form.Field>
                                    <Form.Checkbox
                                        label='Cellular component'
                                        value={OntologyType.CELLULAR_COMPONENT}
                                        checked={termsRelatedToGeneForm.ontology_type.includes(OntologyType.CELLULAR_COMPONENT)}
                                        onChange={(_e, { value }) => handleCheckboxChange('ontology_type', value)}
                                    />
                                </Form.Field>
                            </Form.Group>
                        </Form>

                    </Grid.Column>
                    <Grid.Column width={13}>
                        {/* Table of terms to select */}
                        {/* TODO: implement max height to scroll in this table when have a lot of rows */}
                        {!selectedTerm &&
                            <Table celled selectable>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Term</Table.HeaderCell>
                                        <Table.HeaderCell>Ontology type</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {terms && terms.map((term) => (
                                        <Table.Row key={term.go_id} className='clickable' onClick={() => setSelectedTerm(term.go_id)}>
                                            <Table.Cell>{term.name}</Table.Cell>
                                            <Table.Cell>{term.ontology_type}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>}
                    </Grid.Column>
                </Grid.Row>}

            {/* Selected Term */}
            {selectedTerm &&
                <GeneOntologyCytoscapeChart termId={selectedTerm} goBack={() => setSelectedTerm(null)} />}
        </Grid>
    )
}
