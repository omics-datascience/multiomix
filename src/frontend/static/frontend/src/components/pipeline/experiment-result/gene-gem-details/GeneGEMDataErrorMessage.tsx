import React from 'react'
import { Grid, Header, Icon } from 'semantic-ui-react'

/**
 * Generates a message warning user about invalid data to compute Stats or correlation graph/boxplots
 * @returns Component
 */
export const GeneGEMDataErrorMessage = () => (
    <Grid padded>
        <Grid.Row columns={1}>
            <Grid.Column textAlign='center'>
                <Header icon>
                    <Icon name='warning sign' />
                    There was an error computing information for this combination. Maybe there are few samples to compute the data. Check another combination

                    <Header.Subheader>If the problem persists for others combinations, please, contact us</Header.Subheader>
                </Header>
            </Grid.Column>
        </Grid.Row>
    </Grid>
)
