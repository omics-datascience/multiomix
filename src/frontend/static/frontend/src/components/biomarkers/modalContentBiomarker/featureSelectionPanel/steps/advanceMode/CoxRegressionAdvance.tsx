import React from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import './../../featureSelection.css'
import { AdvanceCoxRegression } from '../../../../types'

interface Props {
    advanceData: AdvanceCoxRegression,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
}
export const CoxRegressionAdvance = (props: Props) => {
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
                        max={60}
                        name='topN'
                        value={advanceData.topN}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)
                            if (numVal < 1) {
                                handleChangeAdvanceAlgorithm('coxRegression', name, 1)
                            } else if (numVal > 60) {
                                handleChangeAdvanceAlgorithm('coxRegression', name, 60)
                            } else {
                                handleChangeAdvanceAlgorithm('coxRegression', name, numVal)
                            }
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
