import React from 'react'
import { Form } from 'semantic-ui-react'
import { FitnessFunctionParameters, SVMParameters } from '../../../../types'
import { SVMKernelOptions } from '../../../../utils'

/** SVMPanel props. */
interface SVMPanelProps {
    parameters: SVMParameters,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
}

/**
 * Renders a panel with all the options for the SVM fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const SVMPanel = (props: SVMPanelProps) => {
    const {
        parameters: svm,
        handleChangeFitnessFunctionOption
    } = props
    return (
        <>
            {/* TODO: uncomment when implemented StatisticalValidations for a ranking task. */}
            {/* <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    name="moleculesTypeOfSelection"
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeSVMOption('task', SVMTask.RANKING)}
                        active={svm.task === SVMTask.RANKING}
                    >
                        Ranking
                    </Button>

                    <Button
                        onClick={() => handleChangeSVMOption('task', SVMTask.REGRESSION)}
                        active={svm.task === SVMTask.REGRESSION}
                    >
                        Regression
                    </Button>
                </Button.Group>
            </Container > */}

            <Form.Select
                selectOnBlur={false}
                placeholder='Kernel'
                label='Kernel'
                name='moleculeSelected'
                options={SVMKernelOptions}
                value={svm.kernel}
                onChange={(_, { value }) => handleChangeFitnessFunctionOption('svmParameters', 'kernel', value as number)}
            />
        </>
    )
}
