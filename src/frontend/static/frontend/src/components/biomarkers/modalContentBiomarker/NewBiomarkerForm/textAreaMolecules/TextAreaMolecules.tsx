import React, { useCallback, useEffect, useState } from 'react'
import { TextArea } from 'semantic-ui-react'
import { useDebounce } from '../../../../../utils/hooks/useDebounce'
import './textAreaMoleculesStyles.css'
interface TextAreaMoleculesProps {
    handleGenesSymbols: (genes: string[]) => void,
}
export const TextAreaMolecules = ({ handleGenesSymbols }: TextAreaMoleculesProps) => {
    const [textAreaString, setTextAreaString] = useState({
        name: 'moleculesTextArea',
        value: ''
    })
    const debouncedTextAreaString = useDebounce(textAreaString.value, 1000)
    const handleInputAreaChange = useCallback((name: string, value: string) => {
        const textFiltered: string[] = []
        const textSplitted = value.split(/,|[|]|;/)
        textSplitted.forEach(item => {
            const itemNoSpace = item.trim()
            return !textFiltered.includes(itemNoSpace) && textFiltered.push(itemNoSpace)
        })
        handleGenesSymbols(textFiltered)
        setTextAreaString({ ...textAreaString, value: '' })
    }, [handleGenesSymbols])
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
            value={textAreaString.value}
            onChange={(_, { value }) => setTextAreaString({ ...textAreaString, value: typeof value === 'string' ? value : '' })}
        />
    )
}
