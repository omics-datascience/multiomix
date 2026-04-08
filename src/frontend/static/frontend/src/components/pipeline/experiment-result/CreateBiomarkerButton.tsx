import React, { useState } from 'react'
import { Form, Modal, Button, Icon, ButtonProps } from 'semantic-ui-react'
import { ExperimentInfo } from '../../../utils/interfaces'

type BiomarkerOption = 'selectAll' | 'selectWithFilters'

interface CreateBiomarkerButtonProps extends Partial<ButtonProps> {
    experimentInfo: ExperimentInfo
    onCreateBiomarker: (options: {
        experimentInfo: ExperimentInfo;
        selectAll: boolean;
    }) => void;
}

const CreateBiomarkerButton: React.FC<CreateBiomarkerButtonProps> = ({
    experimentInfo,
    onCreateBiomarker,
    ...buttonProps
}) => {
    const [open, setOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<BiomarkerOption>('selectAll')

    const handleConfirm = () => {
        onCreateBiomarker({
            experimentInfo,
            selectAll: selectedOption === 'selectAll',
        })
        setOpen(false)
    }

    return (
        <>
            {/* Button that opens the modal */}
            <Button
                label='Create Biomarker'
                icon='dna'
                title='Create Biomarker from result'
                color='green'
                className='space-modal large-modal'
                labelPosition='left'
                onClick={() => setOpen(true)}
                {...buttonProps}
            >
                <Icon name='plus' />
                Create Biomarker
            </Button>

            {/* Modal with options */}
            <Modal
                size='tiny'
                open={open}
                onClose={() => setOpen(false)}
            >
                <Modal.Header>Create Biomarker</Modal.Header>
                <Modal.Content>
                    <p>Select how you want to build the biomarker:</p>
                    <Form>
                        <Form.Group grouped>
                            <Form.Radio
                                label='Select all'
                                name='biomarkerOption'
                                value='selectAll'
                                checked={selectedOption === 'selectAll'}
                                onChange={(_, { value }) => setSelectedOption(value as BiomarkerOption)}
                            />
                            <Form.Radio
                                label='Select with filters'
                                name='biomarkerOption'
                                value='selectWithFilters'
                                checked={selectedOption === 'selectWithFilters'}
                                onChange={(_, { value }) => setSelectedOption(value as BiomarkerOption)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setOpen(false)} color='grey'>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} color='blue'>
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    )
}

export default CreateBiomarkerButton
