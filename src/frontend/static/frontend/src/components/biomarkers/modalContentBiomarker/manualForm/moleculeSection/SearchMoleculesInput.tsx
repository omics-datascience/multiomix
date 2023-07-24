import React, { useCallback, useEffect, useState } from 'react'
import { Input, Icon } from 'semantic-ui-react'
import { BiomarkerType } from '../../../types'
import { debounce } from 'lodash'

/** SearchMoleculesInput props. */
interface SearchMoleculesProps {
    /** If true, the user can edit the molecules in the Biomarker. */
    handleChange: (searchData: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
    handleRestartSection: (sector: BiomarkerType) => void,
    /** `disabled` prop to prevent changes in this section. */
    disabled: boolean
}

/**
 * Renders a search input to filter the molecules in the Biomarker molecules section. Also
 * renders some useful buttons.
 * @param props Component props.
 * @returns Component.
 */
export const SearchMoleculesInput = (props: SearchMoleculesProps) => {
    const [value, setValue] = useState<string>('')

    const { handleChange, handleRemoveInvalidGenes, handleRestartSection, disabled } = props

    /** Makes the query to get KaplanMeierData with delay. */
    const executeHandleChange = useCallback(
        debounce((inputValue: string) => {
            handleChange(inputValue)
        }, 1000),
        []
    )

    /** Every time the input changes executes the debounced search. */
    useEffect(() => {
        executeHandleChange(value)
    }, [value, executeHandleChange])

    return (
        <>
            <Input
                value={value}
                type='text'
                placeholder='Search...'
                onChange={(e) => setValue(e.target.value)}
                icon='search'
            />

            <Icon
                className='biomarker--section--icon clickable margin-left-2'
                name='trash'
                title='Clean search'
                onClick={() => setValue('')}
            />

            <Icon
                className='biomarker--section--icon clickable margin-left-2'
                name='repeat'
                title='Restart molecules (remove all the molecules from this section)'
                onClick={handleRestartSection}
                disabled={disabled}
            />

            <Icon
                className='biomarker--section--icon clickable margin-left-2'
                name='ban'
                title='Remove molecules with errors (in red)'
                color='red'
                onClick={handleRemoveInvalidGenes}
                disabled={disabled}
            />
        </>
    )
}
