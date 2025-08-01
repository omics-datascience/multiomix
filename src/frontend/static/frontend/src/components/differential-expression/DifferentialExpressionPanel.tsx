import React from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'

export const DiferentialExpressionPanel = () => {
    return (
        <Base activeItem='differential-expression' wrapperClass='wrapper'>
            <DifferentialExpressionForm />
        </Base>
    )
}
