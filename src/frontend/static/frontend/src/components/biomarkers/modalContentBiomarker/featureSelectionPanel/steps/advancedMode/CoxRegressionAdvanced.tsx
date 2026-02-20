import React from 'react'
import { Form, Grid } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { AdvancedCoxRegression } from '../../../../types'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    const {
        advanceData,
        handleChangeAdvanceAlgorithm
    } = props
    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Form.Input
                        fluid
                        label={intl.formatMessage({ id: 'coxRegression.keepTopN' })}
                        placeholder={intl.formatMessage({ id: 'coxRegression.integerPlaceholder' })}
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
                        content={intl.formatMessage({ id: 'coxRegression.keepTopN.info' })}
                        onTop={false}
                        onEvent='hover'
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
