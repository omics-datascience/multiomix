import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { FitnessFunctionSvm, SVMTask, SVMKernel } from '../../../../types'

/** SVMPanel props. */
interface SVMPanelProps {
    parameters: FitnessFunctionSvm,
    handleChangeSvmOption: (key: string, value: number) => void,
}

/**
 * Renders a panel with all the options for the SVM fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const SVMPanel = (props: SVMPanelProps) => {
    const {
        parameters: svm,
        handleChangeSvmOption
    } = props
    return (
        <>
            <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    name="moleculesTypeOfSelection"
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeSvmOption('task', SVMTask.RANKING)}
                        active={svm.task === SVMTask.RANKING}
                    >
                        Ranking
                    </Button>

                    <Button
                        onClick={() => handleChangeSvmOption('task', SVMTask.REGRESSION)}
                        active={svm.task === SVMTask.REGRESSION}
                    >
                        Regression
                    </Button>
                </Button.Group>
            </Container>

            <Select
                placeholder='Kernel'
                name='moleculeSelected'
                options={[
                    { key: SVMKernel.LINEAR, text: 'Linear', value: SVMKernel.LINEAR },
                    { key: SVMKernel.POLYNOMIAL, text: 'Polynomial', value: SVMKernel.POLYNOMIAL },
                    { key: SVMKernel.RBF, text: 'RBF', value: SVMKernel.RBF }
                ]}
                value={svm.kernel}
                onChange={(_, { value }) => handleChangeSvmOption('kernel', value as number)}
            />
        </>
    )
}
