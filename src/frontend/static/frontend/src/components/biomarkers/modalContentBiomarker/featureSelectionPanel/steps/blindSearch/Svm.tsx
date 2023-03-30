import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { Nullable } from '../../../../../../utils/interfaces'
import { FitnessFunctionSvm, SvmButtons, SvmParameters } from '../../../../types'
const options = [
    { key: SvmParameters.LINEAR, text: 'Linear', value: SvmParameters.LINEAR, disabled: false },
    { key: SvmParameters.POLYNOMIAL, text: 'Polynomial', value: SvmParameters.POLYNOMIAL, disabled: false },
    { key: SvmParameters.RBF, text: 'RBF', value: SvmParameters.RBF, disabled: false }
]
interface Props {
    svm: Nullable<FitnessFunctionSvm>,
    handleChangeSvmOption: (value: number, key: string) => void,
}
export const Svm = (props: Props) => {
    const {
        svm,
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
                        onClick={() => handleChangeSvmOption(SvmButtons.RANKING, 'selection')}
                        active={svm?.selection === SvmButtons.RANKING}
                    >
                        Ranking
                    </Button>

                    <Button
                        onClick={() => handleChangeSvmOption(SvmButtons.REGRESSION, 'selection')}
                        active={svm?.selection === SvmButtons.REGRESSION}
                    >
                        Regression
                    </Button>
                </Button.Group>
            </Container>
            <Select
                className=''
                placeholder='Kernel'
                name='moleculeSelected'
                options={options}
                value={svm?.parameters}
                onChange={(_, { value }) => handleChangeSvmOption(value as number, 'parameters')}
            />
        </>
    )
}
