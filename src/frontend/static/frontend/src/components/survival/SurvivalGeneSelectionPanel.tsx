import React from 'react'
import { Segment, Grid, Header, Dropdown, DropdownItemProps } from 'semantic-ui-react'
import { listToDropdownOptions } from '../../utils/util_functions'

/**
 * Component's props
 */
interface SurvivalGeneSelectionPanelProps {
    genes: string[],
    selectedGenes: string[],
    onHandleGenesChanges: (selectedGenes) => void
}

/**
 * Renders a form to select a subset of genes from the expression dataset
 * @param props Component's props
 * @returns Component
 */
export const SurvivalGeneSelectionPanel = (props: SurvivalGeneSelectionPanelProps) => {
    const genesOptions: DropdownItemProps[] = listToDropdownOptions(props.genes)
    const optionsArrayIsEmpty = genesOptions.length === 0

    return (
        <Segment>
            <Grid className='padded-left-10 padded-right-10'>
                {/* File type for expression dataset */}
                <Grid.Row>
                    <Header textAlign='center'>
                        <Header.Content>Select Genes</Header.Content>
                    </Header>

                    <Dropdown
                        placeholder='State'
                        fluid
                        multiple
                        search
                        selection
                        onChange={(_, { value }) => props.onHandleGenesChanges(value)}
                        value={props.selectedGenes}
                        disabled={optionsArrayIsEmpty}
                        options={genesOptions}
                    />
                </Grid.Row>
            </Grid>
        </Segment>
    )
}
