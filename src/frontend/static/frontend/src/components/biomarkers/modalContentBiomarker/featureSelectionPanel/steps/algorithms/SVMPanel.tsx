import React from 'react'
import { Select } from 'semantic-ui-react'
import { SVMParameters } from '../../../../types'
import { SVMKernelOptions } from '../../../../utils'

/** SVMPanel props. */
interface SVMPanelProps {
    parameters: SVMParameters,
    handleChangeSVMOption: (key: string, value: number) => void,
}

/**
 * Renders a panel with all the options for the SVM fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const SVMPanel = (props: SVMPanelProps) => {
    const {
        parameters: svm,
        handleChangeSVMOption
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

            <Select
                selectOnBlur={false}
                placeholder='Kernel'
                name='moleculeSelected'
                options={SVMKernelOptions}
                value={svm.kernel}
                onChange={(_, { value }) => handleChangeSVMOption('kernel', value as number)}
            />
        </>
    )
}
