import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { FitnessFunctionSvm, SvmButtons, SvmParameters } from '../../../../types'

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
                        onClick={() => handleChangeSvmOption('selection', SvmButtons.RANKING)}
                        active={svm.selection === SvmButtons.RANKING}
                    >
                        Ranking
                    </Button>

                    <Button
                        onClick={() => handleChangeSvmOption('selection', SvmButtons.REGRESSION)}
                        active={svm.selection === SvmButtons.REGRESSION}
                    >
                        Regression
                    </Button>
                </Button.Group>
            </Container>

            <Select
                placeholder='Kernel'
                name='moleculeSelected'
                options={[
                    { key: SvmParameters.LINEAR, text: 'Linear', value: SvmParameters.LINEAR, disabled: false },
                    { key: SvmParameters.POLYNOMIAL, text: 'Polynomial', value: SvmParameters.POLYNOMIAL, disabled: false },
                    { key: SvmParameters.RBF, text: 'RBF', value: SvmParameters.RBF, disabled: false }
                ]}
                value={svm.parameters}
                onChange={(_, { value }) => handleChangeSvmOption('parameters', value as number)}
            />
        </>
    )
}
