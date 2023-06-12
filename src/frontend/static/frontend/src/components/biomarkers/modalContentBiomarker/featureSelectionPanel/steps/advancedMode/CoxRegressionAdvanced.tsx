import React from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import './../../featureSelection.css'
import { AdvancedCoxRegression } from '../../../../types'

declare const maxFeaturesCoxRegression: number

/** CoxRegressionAdvanced props. */
interface CoxRegressionAdvancedProps {
    advanceData: AdvancedCoxRegression,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
}

/**
 * Renders a form to set some advanced parameters for the CoxRegression algorithm.
 * @param props Component props.
 * @returns Component.
 */
export const CoxRegressionAdvanced = (props: CoxRegressionAdvancedProps) => {
    const {
        advanceData,
        handleChangeAdvanceAlgorithm
    } = props
    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label='Keep top N'
                        placeholder='An integer number'
                        type='number'
                        step={1}
                        min={1}
                        max={maxFeaturesCoxRegression}
                        name='topN'
                        value={advanceData.topN}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)
                            if (numVal < 1 || isNaN(numVal) || numVal > maxFeaturesCoxRegression) {
                                return
                            }
                            handleChangeAdvanceAlgorithm('coxRegression', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content='Maximum number of features to be retained after processing. The features are ordered in descending order by their coefficients, keeping the most significant ones first. If this value is left empty, all those whose coefficients are different from 0 will be retained'
                        onTop={false}
                        onEvent='hover'
                        extraClassName=''
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
