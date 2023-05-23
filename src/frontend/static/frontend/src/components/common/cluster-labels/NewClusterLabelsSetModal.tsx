import React, { useEffect, useState } from 'react'
import { Button, Divider, Form, Grid, Header, Icon, Modal, Segment } from 'semantic-ui-react'
import { ClusterLabelsSet } from '../../biomarkers/types'
import { HexAlphaColorPicker } from 'react-colorful'
import { alertGeneralError, getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'

declare const urlClusterLabelsSets: string

/** NewClusterLabelsSetModal props. */
interface NewClusterLabelsSetModalProps {
    /** TrainedModel primary key to add a new ClusterLabelsSet to it. */
    trainedModelPk: number,
    /** Modal's open prop. */
    showNewClusterLabelsSet: boolean,
    /** Function to set the modal's open prop. */
    setShowNewClusterLabelsSet: (newValue: boolean) => void
}

const getDefaultClusterLabelsSet = (trainedModelPk: number): ClusterLabelsSet => ({
    name: '',
    description: '',
    trained_model: trainedModelPk,
    labels: []
})

export const NewClusterLabelsSetModal = (props: NewClusterLabelsSetModalProps) => {
    const [newClusterLabelsSet, setNewClusterLabelsSet] = useState<ClusterLabelsSet>(getDefaultClusterLabelsSet(props.trainedModelPk))
    const [sendingData, setSendingData] = useState(false)

    /** Resets the form when closes the modal. */
    useEffect(() => {
        if (!props.showNewClusterLabelsSet) {
            setNewClusterLabelsSet(getDefaultClusterLabelsSet(props.trainedModelPk))
        }
    }, [props.showNewClusterLabelsSet])

    /**
     * Handles changes in the form.
     * @param name Key in the form to change.
     * @param value New value.
     */
    const handleChanges = (name: string, value: any) => {
        setNewClusterLabelsSet({
            ...newClusterLabelsSet,
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
        const labels = [...newClusterLabelsSet.labels]
        labels[idx] = {
            ...labels[idx],
            [name]: value
        }

        setNewClusterLabelsSet({
            ...newClusterLabelsSet,
            labels
        })
    }

    /**
     * Removes the label at the given index.
     * @param idx Index of the label to remove.
     */
    const removeLabel = (idx: number) => {
        const labels = [...newClusterLabelsSet.labels]
        labels.splice(idx, 1)

        setNewClusterLabelsSet({
            ...newClusterLabelsSet,
            labels
        })
    }

    /** Adds a new ClusterInstance instance */
    const addLabel = () => {
        const labels = [...newClusterLabelsSet.labels]
        labels.push({
            cluster_id: labels.length,
            label: '',
            color: ''
        })

        setNewClusterLabelsSet({
            ...newClusterLabelsSet,
            labels
        })
    }

    const submit = () => {
        setSendingData(true)

        const settings = {
            headers: getDjangoHeader(),
            json: newClusterLabelsSet
        }

        ky.post(urlClusterLabelsSets, settings).then((response) => {
            response.json().then((_jsonResponse: ClusterLabelsSet) => {
                props.setShowNewClusterLabelsSet(false)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error adding ClusterLabelsSet ->', err)
        }).finally(() => {
            setSendingData(false)
        })
    }

    /**
     * Handles the submit of the form.
     * @returns True if the form is valid.
     */
    const formIsValid = (): boolean => {
        return newClusterLabelsSet.name !== '' &&
            newClusterLabelsSet.labels.length > 0 &&
            !newClusterLabelsSet.labels.some((labelObj) => labelObj.label.trim() === '' || labelObj.cluster_id < 0 || labelObj.cluster_id.toString().trim() === '')
    }

    return (
        <Modal
            closeIcon={<Icon name='close' size='large' />}
            closeOnEscape={false}
            centered={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            size='tiny'
            onClose={() => { props.setShowNewClusterLabelsSet(false) }}
            open={props.showNewClusterLabelsSet}
        >
            <Modal.Header>
                <Icon name='add circle' />
                New Cluster labels sets
            </Modal.Header>
            <Modal.Content>
                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header>New ClusterLabelsSet</Header>

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

                                {newClusterLabelsSet.labels.map((label, idx) => (
                                    <Segment key={idx}>
                                        <Grid>
                                            <Grid.Row columns={2}>
                                                <Grid.Column width={8}>
                                                    <Form.Input
                                                        label='Cluster ID'
                                                        placeholder='Cluster ID'
                                                        name='cluster_id'
                                                        icon='asterisk'
                                                        min={0}
                                                        value={label.cluster_id}
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
                    onClick={() => props.setShowNewClusterLabelsSet(false)}
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
