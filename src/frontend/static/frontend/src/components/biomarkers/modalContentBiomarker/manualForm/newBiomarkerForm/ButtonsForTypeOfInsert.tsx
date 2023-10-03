import React from 'react'
import { Button, Container } from 'semantic-ui-react'
import { MoleculesTypeOfSelection } from '../../../types'

interface ButtonsForTypeOfInsertProps {
    handleChangeMoleculeInputSelected: (value: MoleculesTypeOfSelection) => void,
    moleculesTypeOfSelection: MoleculesTypeOfSelection
}

export const ButtonsForTypeOfInsert = ({ handleChangeMoleculeInputSelected, moleculesTypeOfSelection }: ButtonsForTypeOfInsertProps) => {
    return (
        <Container className='biomarkers--side--bar--box'>
            <Button.Group
                compact
                name="moleculesTypeOfSelection"
                className='biomarkers--side--bar--buttons-group'
            >
                <Button
                    onClick={() => handleChangeMoleculeInputSelected(MoleculesTypeOfSelection.INPUT)}
                    active={moleculesTypeOfSelection === MoleculesTypeOfSelection.INPUT}
                >
                    Select<br />molecules
                </Button>

                <Button
                    onClick={() => handleChangeMoleculeInputSelected(MoleculesTypeOfSelection.AREA)}
                    active={moleculesTypeOfSelection === MoleculesTypeOfSelection.AREA}
                >
                    Insert<br />Molecules
                </Button>
            </Button.Group>
        </Container>
    )
}
