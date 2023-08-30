import React, { useCallback, useEffect, useState } from 'react'
import { TextArea } from 'semantic-ui-react'
import _ from 'lodash'

interface TextAreaMoleculesProps {
    handleGenesSymbols: (genes: string[]) => boolean,
}

export const TextAreaMolecules = (props: TextAreaMoleculesProps) => {
    const { handleGenesSymbols } = props
    const [textAreaString, setTextAreaString] = useState({
        name: 'moleculesTextArea',
        value: ''
    })
    const makeSearchRequest = useCallback(
        _.debounce((value: string) => {
            handleInputAreaChange(textAreaString.name, value)
        }, 1000),
        []
    )
    const handleInputAreaChange = useCallback((name: string, value: string) => {
        const textFiltered: string[] = []
        /* Text is split by 'Tabs' - ',' - ';' - 'Enters' */
        const textSplitted = value.split(/\t|,|;|\n/)
        textSplitted.forEach(item => {
            const itemNoSpace = item.trim()
            return !textFiltered.includes(itemNoSpace) && itemNoSpace && textFiltered.push(itemNoSpace)
        })
        const searchGenesResult = handleGenesSymbols(textFiltered)
        if (searchGenesResult) {
            setTextAreaString({ ...textAreaString, value: '' })
        }
    }, [handleGenesSymbols])
    /** Every time the query changes, makes a debounced request. */
    useEffect(() => {
        if (textAreaString.value) {
            makeSearchRequest(textAreaString.value)
        }
    }, [textAreaString.value])
    return (
        <TextArea
            style={{ maxWidth: '100%', minWidth: '100%' }}
            className="biomarkers--side--bar--text--area"
            placeholder='Insert molecules'
            name='moleculesTextArea'
            rows={10}
            value={textAreaString.value}
            onChange={(_, { value }) => setTextAreaString({ ...textAreaString, value: typeof value === 'string' ? value : '' })}
        />
    )
}
