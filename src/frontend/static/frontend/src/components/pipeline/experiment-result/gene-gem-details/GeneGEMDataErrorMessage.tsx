import React from 'react'
import { Grid, Header, Icon } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

/**
 * Generates a message warning user about invalid data to compute Stats or correlation graph/boxplots
 * @returns Component
 */
export const GeneGEMDataErrorMessage = () => {
    const intl = useIntl()

    return (
        <Grid padded>
            <Grid.Row columns={1}>
                <Grid.Column textAlign='center'>
                    <Header icon>
                        <Icon name='warning sign' />
                        {intl.formatMessage({ id: 'geneGEMDataErrorMessage.header' })}
                        <Header.Subheader>
                            {intl.formatMessage({ id: 'geneGEMDataErrorMessage.subheader' })}
                        </Header.Subheader>
                    </Header>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
