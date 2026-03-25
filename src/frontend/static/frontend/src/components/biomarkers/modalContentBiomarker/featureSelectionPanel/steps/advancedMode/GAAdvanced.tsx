import React from 'react'
import { Checkbox, Grid, Input } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { AdvancedGA } from '../../../../types'
import { ExternalLink } from '../../../../../common/ExternalLink'
import { useIntl } from 'react-intl'

declare const sparkIntegrationIsEnabled: boolean
declare const minIterationsMetaheuristics: number
declare const maxIterationsMetaheuristics: number
declare const minPopulationSizeGA: number
declare const maxPopulationSizeGA: number

/** GAAdvanced props. */
interface GAAdvancedProps {
    advancedData: AdvancedGA,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
}

/**
 * Renders a form to set some advanced parameters for the GA algorithm.
 * @param props Component props.
 * @returns Component.
 */
export const GAAdvanced = (props: GAAdvancedProps) => {
    const { advancedData, handleChangeAdvanceAlgorithm } = props
    const intl = useIntl()

    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label={intl.formatMessage({ id: 'ga.populationSize' })}
                        placeholder={intl.formatMessage({ id: 'common.integerPlaceholder' })}
                        type='number'
                        step={1}
                        min={minPopulationSizeGA}
                        max={maxPopulationSizeGA}
                        name='populationSize'
                        value={advancedData.populationSize}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)

                            if (numVal < minPopulationSizeGA || isNaN(numVal) || numVal > maxPopulationSizeGA) {
                                return
                            }

                            handleChangeAdvanceAlgorithm('GA', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={intl.formatMessage({ id: 'ga.populationSize.info' })}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label={intl.formatMessage({ id: 'ga.mutationRate' })}
                        placeholder={intl.formatMessage({ id: 'ga.floatPlaceholder' })}
                        type='number'
                        step={0.01}
                        name='mutationRate'
                        value={advancedData.mutationRate}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)

                            // Prevents to set a value lower or higher than the limits
                            if (numVal < 0.0 || isNaN(numVal)) {
                                return
                            }

                            handleChangeAdvanceAlgorithm('GA', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={intl.formatMessage({ id: 'ga.mutationRate.info' })}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label={intl.formatMessage({ id: 'common.numberOfIterations' })}
                        placeholder={intl.formatMessage({ id: 'common.integerPlaceholder' })}
                        type='number'
                        step={1}
                        min={minIterationsMetaheuristics}
                        max={maxIterationsMetaheuristics}
                        name='numberOfIterations'
                        value={advancedData.numberOfIterations}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)

                            // Prevents to set a value lower or higher than the limits
                            if (numVal < minIterationsMetaheuristics || isNaN(numVal) || numVal > maxIterationsMetaheuristics) {
                                return
                            }

                            handleChangeAdvanceAlgorithm('GA', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={intl.formatMessage({ id: 'ga.numberOfIterations.info' })}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>

            {/* Apache Spark optimization */}
            {sparkIntegrationIsEnabled && (
                <Grid.Row columns={2}>
                    <Grid.Column width={14}>
                        <Checkbox
                            label={intl.formatMessage({ id: 'ga.useSpark' })}
                            checked={advancedData.useSpark}
                            onChange={(_e, { checked }) => { handleChangeAdvanceAlgorithm('GA', 'useSpark', checked ?? false) }}
                        />
                    </Grid.Column>
                    <Grid.Column width={2} className='advance-center-container'>
                        <InfoPopup
                            content={(
                                <p>
                                    {intl.formatMessage({ id: 'ga.useSpark.info' })}{' '}
                                    <ExternalLink href='https://spark.apache.org/'>Apache Spark</ExternalLink>

                                </p>
                            )}
                            onTop={false}
                        />
                    </Grid.Column>
                </Grid.Row>
            )}
        </Grid>
    )
}
