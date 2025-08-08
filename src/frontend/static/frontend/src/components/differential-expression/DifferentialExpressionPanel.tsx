import React from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'
import { Grid } from 'semantic-ui-react'

export const DiferentialExpressionPanel = () => {
    return (
        <Base activeItem='differential-expression' wrapperClass='wrapper'>
            <Grid columns={2} padded stackable divided className='biomarkers--modal--container'>
                <Grid.Column width={4} textAlign='center'>

                    <DifferentialExpressionForm />

                </Grid.Column>
                <Grid.Column width={12}>

                </Grid.Column>
            </Grid>
        </Base>
    )
}
