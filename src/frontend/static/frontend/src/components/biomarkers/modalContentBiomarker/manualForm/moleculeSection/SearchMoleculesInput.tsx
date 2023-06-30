import React, { useCallback, useEffect, useState } from 'react'
import { Input, Icon } from 'semantic-ui-react'
import { BiomarkerType } from '../../../types'
import { debounce } from 'lodash'

/** SearchMoleculesInput props. */
interface SearchMoleculesProps {
    /** If true, the user can edit the molecules in the Biomarker. */
    canEditMolecules: boolean,
    handleChange: (searchData: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
}

export const SearchMoleculesInput = ({ canEditMolecules, handleChange, handleRemoveInvalidGenes }: SearchMoleculesProps) => {
    const [value, setValue] = useState<string>('')

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
                onClick={() => { setValue('') }}
            />

            {canEditMolecules &&
                <Icon
                    className='biomarker--section--icon clickable margin-left-2'
                    name='ban'
                    title='Remove molecules with errors (in red)'
                    color='red'
                    onClick={handleRemoveInvalidGenes}
                />
            }
        </>
    )
}
