import React, { useCallback, useEffect, useState } from 'react'
import { TextArea } from 'semantic-ui-react'
import { useDebounce } from '../../../../../utils/hooks/useDebounce'
import { MoleculesSectionData } from '../../../types'
import './textAreaMoleculesStyles.css'
interface TextAreaMoleculesProps {
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void
}
export const TextAreaMolecules = ({ handleAddMoleculeToSection }: TextAreaMoleculesProps) => {
    const [textAreaString, setTextAreaString] = useState({
        name: 'moleculesTextArea',
        value: ''
    })
    const debouncedTextAreaString = useDebounce(textAreaString.value, 500)
    const handleInputAreaChange = useCallback((name: string, value: string) => {
        const textSplitted = value.split(' ')
        const textClean = textSplitted.filter(item => ![',', ';', '|'].includes(item))
        console.log(textClean, 'tengo que seguir laburandolo jaja')
        console.log('Aca invoco Genes symbols validator')
    }, [])
    useEffect(() => {
        if (textAreaString.value) {
            handleInputAreaChange(textAreaString.name, debouncedTextAreaString)
        }
    }, [debouncedTextAreaString, handleInputAreaChange])
    return (
        <TextArea
            className="biomarkers--side--bar--text--area"
            placeholder='Insert molecules'
            name='moleculesTextArea'
            onChange={(_, { value }) => setTextAreaString({ ...textAreaString, value: typeof value === 'string' ? value : '' })}
        />
    )
}
