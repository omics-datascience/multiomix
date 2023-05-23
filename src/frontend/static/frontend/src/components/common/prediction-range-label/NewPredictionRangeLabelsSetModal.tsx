import React, { useEffect, useState } from 'react'
import { Button, Divider, Form, Grid, Header, Icon, Modal, Segment } from 'semantic-ui-react'
import { PredictionRangeLabelsSet } from '../../biomarkers/types'
import { HexAlphaColorPicker } from 'react-colorful'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'

declare const urlPredictionRangeLabelsSets: string

/** NewPredictionRangeLabelsSetModal props. */
interface NewPredictionRangeLabelsSetModalProps {
    /** TrainedModel primary key to add a new PredictionRangeLabelsSet to it. */
    trainedModelPk: number,
    /** Modal's open prop. */
    showNewPredictionRangeLabelsSet: boolean,
    /** Function to set the modal's open prop. */
    setShowNewPredictionRangeLabelsSet: (newValue: boolean) => void
}

const getDefaultPredictionRangeLabelsSet = (trainedModelPk: number): PredictionRangeLabelsSet => ({
    name: '',
    description: '',
    trained_model: trainedModelPk,
    labels: []
})

export const NewPredictionRangeLabelsSetModal = (props: NewPredictionRangeLabelsSetModalProps) => {
    const [newPredictionRangeLabelsSet, setNewPredictionRangeLabelsSet] = useState<PredictionRangeLabelsSet>(getDefaultPredictionRangeLabelsSet(props.trainedModelPk))
    const [sendingData, setSendingData] = useState(false)

    /** Resets the form when closes the modal. */
    useEffect(() => {
        if (!props.showNewPredictionRangeLabelsSet) {
            setNewPredictionRangeLabelsSet(getDefaultPredictionRangeLabelsSet(props.trainedModelPk))
        }
    }, [props.showNewPredictionRangeLabelsSet])

    /**
     * Handles changes in the form.
     * @param name Key in the form to change.
     * @param value New value.
     */
    const handleChanges = (name: string, value: any) => {
        setNewPredictionRangeLabelsSet({
            ...newPredictionRangeLabelsSet,
            [name]: value
        })
    }

    /**
     * Handles changes in the labels array.
     * @param idx Index in the list of labels to change.
     * @param name Key in the form to change.
     * @param value New value.
     */
    const handleChangesLabel = (idx: number, name: string, value: any) => {
        const labels = [...newPredictionRangeLabelsSet.labels]
        labels[idx] = {
            ...labels[idx],
            [name]: value
        }

        setNewPredictionRangeLabelsSet({
            ...newPredictionRangeLabelsSet,
            labels
        })
    }

    /**
     * Removes the label at the given index.
     * @param idx Index of the label to remove.
     */
    const removeLabel = (idx: number) => {
        const labels = [...newPredictionRangeLabelsSet.labels]
        labels.splice(idx, 1)

        setNewPredictionRangeLabelsSet({
            ...newPredictionRangeLabelsSet,
            labels
        })
    }

    /** Adds a new ClusterInstance instance */
    const addLabel = () => {
        const labels = [...newPredictionRangeLabelsSet.labels]
        labels.push({
            min_value: 0, // TODO: mark as the max of all the labels
            max_value: 0,
            label: '',
            color: ''
        })

        setNewPredictionRangeLabelsSet({
            ...newPredictionRangeLabelsSet,
            labels
        })
    }

    const submit = () => {
        setSendingData(true)

        const settings = {
            headers: getDjangoHeader(),
            json: newPredictionRangeLabelsSet
        }

        ky.post(urlPredictionRangeLabelsSets, settings).then((response) => {
            response.json().then((_jsonResponse: PredictionRangeLabelsSet) => {
                props.setShowNewPredictionRangeLabelsSet(false)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error adding PredictionRangeLabelsSet ->', err)
        }).finally(() => {
            setSendingData(false)
        })
    }

    /**
     * Handles the submit of the form.
     * @returns True if the form is valid.
     */
    const formIsValid = (): boolean => {
        return newPredictionRangeLabelsSet.name !== '' &&
            newPredictionRangeLabelsSet.labels.length > 0 // &&
            // TODO: check if the labels min_value and max_value are valid
            // !newPredictionRangeLabelsSet.labels.some((labelObj) => labelObj.label.trim() === '' || labelObj.cluster_id < 0 || labelObj.cluster_id.toString().trim() === '')
    }

    return (
        <Modal
            closeIcon={<Icon name='close' size='large' />}
            closeOnEscape={false}
            centered={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            size='tiny'
            onClose={() => { props.setShowNewPredictionRangeLabelsSet(false) }}
            open={props.showNewPredictionRangeLabelsSet}
        >
            <Modal.Header>
                <Icon name='add circle' />
                New Cluster labels sets
            </Modal.Header>
            <Modal.Content>
                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header>New PredictionRangeLabelsSet</Header>

                            <Form>
                                <Form.Input
                                    label='Name'
                                    placeholder='Name'
                                    name='name'
                                    icon='asterisk'
                                    onChange={(_, { name, value }) => handleChanges(name, value)}
                                />

                                <Form.TextArea
                                    label='Description'
                                    placeholder='Description'
                                    name='description'
                                    onChange={(_, { name, value }) => handleChanges(name, value)}
                                />

                                <Divider />

                                {/* List of labels */}
                                <Header as='h2'>Labels</Header>

                                {newPredictionRangeLabelsSet.labels.map((label, idx) => (
                                    <Segment key={idx}>
                                        <Grid>
                                            <Grid.Row columns={2}>
                                                <Grid.Column width={8}>
                                                    <Form.Input
                                                        label='Min value'
                                                        placeholder='Min value'
                                                        name='min_value'
                                                        icon='asterisk'
                                                        min={0}
                                                        value={label.min_value}
                                                        onChange={(_, { name, value }) => handleChangesLabel(idx, name, value)}
                                                        type='number'
                                                    />

                                                    <Form.Input
                                                        label='Max value'
                                                        placeholder='Max value'
                                                        name='max_value'
                                                        value={label.max_value}
                                                        onChange={(_, { name, value }) => handleChangesLabel(idx, name, value)}
                                                        type='number'
                                                    />

                                                    <Form.Input
                                                        label='Label'
                                                        placeholder='Label'
                                                        icon='asterisk'
                                                        name='label'
                                                        value={label.label}
                                                        onChange={(_, { name, value }) => handleChangesLabel(idx, name, value)}
                                                    />

                                                    <Form.Field>
                                                        <Icon name='asterisk' /> Required field
                                                    </Form.Field>

                                                    <Form.Field>
                                                        <Button
                                                            name='ban'
                                                            color='red'
                                                            fluid
                                                            onClick={() => { removeLabel(idx) }}
                                                        >
                                                            Delete label
                                                        </Button>
                                                    </Form.Field>
                                                </Grid.Column>
                                                {/* Color */}
                                                <Grid.Column width={8}>
                                                    <label>
                                                        <strong>Color</strong>
                                                    </label>
                                                    <HexAlphaColorPicker color={label.color} onChange={(color) => { handleChangesLabel(idx, 'color', color) } } />
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Segment>
                                ))}

                                <Button primary fluid onClick={addLabel}>Add label</Button>
                            </Form>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    color="red"
                    onClick={() => props.setShowNewPredictionRangeLabelsSet(false)}
                >
                    Cancel
                </Button>

                <Button
                    color="green"
                    loading={sendingData}
                    onClick={submit}
                    disabled={!formIsValid()}
                >
                    Confirm
                </Button>
            </Modal.Actions>
        </Modal>
    )
}
