import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { FitnessFunctionSvm, SvmTask, SvmKernel } from '../../../../types'

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
                        onClick={() => handleChangeSvmOption('selection', SvmTask.RANKING)}
                        active={svm.selection === SvmTask.RANKING}
                    >
                        Ranking
                    </Button>

                    <Button
                        onClick={() => handleChangeSvmOption('selection', SvmTask.REGRESSION)}
                        active={svm.selection === SvmTask.REGRESSION}
                    >
                        Regression
                    </Button>
                </Button.Group>
            </Container>

            <Select
                placeholder='Kernel'
                name='moleculeSelected'
                options={[
                    { key: SvmKernel.LINEAR, text: 'Linear', value: SvmKernel.LINEAR, disabled: false },
                    { key: SvmKernel.POLYNOMIAL, text: 'Polynomial', value: SvmKernel.POLYNOMIAL, disabled: false },
                    { key: SvmKernel.RBF, text: 'RBF', value: SvmKernel.RBF, disabled: false }
                ]}
                value={svm.parameters}
                onChange={(_, { value }) => handleChangeSvmOption('parameters', value as number)}
            />
        </>
    )
}
