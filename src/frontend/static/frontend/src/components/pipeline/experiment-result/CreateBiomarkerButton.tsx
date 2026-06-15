import React, { useState } from 'react'
import { Form, Modal, Button, Icon, ButtonProps } from 'semantic-ui-react'
import { ExperimentInfo } from '../../../utils/interfaces'
import { useIntl } from 'react-intl'

type BiomarkerOption = 'selectAll' | 'selectWithFilters'

/**
 * Props for the CreateBiomarkerButton component.
 * Extends Semantic UI's ButtonProps to allow passing any native button attribute.
 */
interface CreateBiomarkerButtonProps extends Partial<ButtonProps> {
    /** Experiment metadata used to create the biomarker. */
    experimentInfo: ExperimentInfo
    /**
     * Callback triggered when the user confirms the biomarker creation.
     * @param options.experimentInfo - The experiment associated with the biomarker.
     * @param options.selectAll - `true` if all genes are selected, `false` if filters should be applied.
     */
    onCreateBiomarker: (options: {
        experimentInfo: ExperimentInfo;
        selectAll: boolean;
    }) => void;
}

/**
 * `CreateBiomarkerButton` renders a button that opens a confirmation modal
 * allowing the user to choose how to build a biomarker from an experiment result.
 *
 * The modal presents two options:
 * - **Select all**: includes all available genes.
 * - **Select with filters**: applies active filters before building the biomarker.
 *
 * Once the user confirms, the `onCreateBiomarker` callback is invoked with
 * the selected experiment info and the chosen selection mode.
 * @param props - Component props. See {@link CreateBiomarkerButtonProps}.
 * @returns A trigger button and a confirmation modal for biomarker creation.
 * @example
 * <CreateBiomarkerButton
 *   experimentInfo={experiment}
 *   onCreateBiomarker={({ experimentInfo, selectAll }) => {
 *     console.log('Creating biomarker', experimentInfo, selectAll)
 *   }}
 * />
 */
const CreateBiomarkerButton: React.FC<CreateBiomarkerButtonProps> = (props) => {
    const intl = useIntl()
    // Destructure component-specific props and forward the rest to the underlying Button
    const { experimentInfo, onCreateBiomarker, ...buttonProps } = props

    // Controls the modal visibility
    const [open, setOpen] = useState(false)

    // Tracks which biomarker creation option the user has selected
    const [selectedOption, setSelectedOption] = useState<BiomarkerOption>('selectAll')

    // Invokes the callback with the selected options and closes the modal
    const handleConfirm = () => {
        onCreateBiomarker({
            experimentInfo,
            selectAll: selectedOption === 'selectAll', // true if 'selectAll', false if 'selectWithFilters'
        })
        setOpen(false)
    }

    return (
        <>
            {/* Button that opens the modal */}
            <Button
                label={intl.formatMessage({ id: 'createBiomarkerButton.label' })}
                icon='dna'
                title={intl.formatMessage({ id: 'createBiomarkerButton.title' })}
                color='green'
                className='space-modal large-modal'
                labelPosition='left'
                onClick={() => setOpen(true)}
                {...buttonProps}
            >
                <Icon name='plus' />
                {intl.formatMessage({ id: 'createBiomarkerButton.label' })}
            </Button>

            {/* Modal with options */}
            <Modal
                size='tiny'
                open={open}
                onClose={() => setOpen(false)}
            >
                <Modal.Header>{intl.formatMessage({ id: 'createBiomarkerButton.modal.header' })}</Modal.Header>
                <Modal.Content>
                    <p>{intl.formatMessage({ id: 'createBiomarkerButton.modal.description' })}</p>
                    <Form>
                        <Form.Group grouped>
                            <Form.Radio
                                label={intl.formatMessage({ id: 'createBiomarkerButton.option.selectAll' })}
                                name='biomarkerOption'
                                value='selectAll'
                                checked={selectedOption === 'selectAll'}
                                onChange={(_, { value }) => setSelectedOption(value as BiomarkerOption)}
                            />
                            <Form.Radio
                                label={intl.formatMessage({ id: 'createBiomarkerButton.option.selectWithFilters' })}
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
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button onClick={handleConfirm} color='blue'>
                        {intl.formatMessage({ id: 'common.confirm' })}
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    )
}

export default CreateBiomarkerButton
