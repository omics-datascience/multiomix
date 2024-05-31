import React from 'react'
import { Grid } from 'semantic-ui-react'
import { MiRNAExtraData } from '../../../../pipeline/experiment-result/gene-gem-details/MiRNAExtraData'

/**
 * Component's props
 */
interface MiRNAInformationProps {
    /** miRNA identifier to send to the backend. */
    selectedMiRNA: string,
}

/**
 * Renders a panel with general information of a miRNA molecule. It's a wrapper for the MiRNAExtraData component
 * (useful to center in the middle of the screen).
 * @param props Component props.
 * @returns Component.
 */
export const MiRNAInformation = (props: MiRNAInformationProps) => {
    return (
        <Grid padded>
            <Grid.Row columns={1} className='min-height-50vh' verticalAlign='middle'>
                <Grid.Column textAlign='center'>
                    <MiRNAExtraData miRNA={props.selectedMiRNA} />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
