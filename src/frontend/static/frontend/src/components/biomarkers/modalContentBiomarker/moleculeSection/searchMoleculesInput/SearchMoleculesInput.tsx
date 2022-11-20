import React, { useState } from 'react'
import { Input, Button, Icon } from 'semantic-ui-react'
interface SerachMoleculesProps {
    handleSearchData: (searchData: string) => void
}
export const SearchMoleculesInput = ({ handleSearchData }: SerachMoleculesProps) => {
    const [inputData, setInputData] = useState('')
    return (
        <div>
            <Input
                value={inputData}
                type='text'
                placeholder='Search...'
                onChange={(e) => setInputData(e.target.value)}
            >
                <input
                />
                <Button onClick={() => handleSearchData(inputData)}>
                    <Icon name='search' />
                </Button>
                <Button onClick={() => {
                    setInputData('')
                    handleSearchData('')
                }}>
                    <Icon name='delete' />
                </Button>
            </Input>
        </div>
    )
}
