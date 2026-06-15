import React from 'react'
import { Checkbox, Form, Grid } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { advanceBBHAOptions, improvedBBHACoeff1Options, improvedBBHACoeff2Options } from '../../../../utils'
import { AdvancedBBHA, BBHAVersion } from '../../../../types'
import { ExternalLink } from '../../../../../common/ExternalLink'
import { useIntl } from 'react-intl'

declare const sparkIntegrationIsEnabled: boolean
declare const minIterationsMetaheuristics: number
declare const maxIterationsMetaheuristics: number
declare const minStarsBBHA: number
declare const maxStarsBBHA: number

/** BBHAAdvanced props. */
interface BBHAAdvancedProps {
    advancedData: AdvancedBBHA,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
}

/**
 * Simple component for explanation over coeff1 and coeff2 parameters
 * @returns Component.
 */
const CoeffExplanation = () => {
    const intl = useIntl()
    return (
        <p>
            {intl.formatMessage({ id: 'bbha.coefficientExplanation' })}{' '}
            <ExternalLink href='https://www.tandfonline.com/doi/full/10.1080/0305215X.2018.1540697'>
                improved Binary Black Hole Algorithm
            </ExternalLink>
        </p>
    )
}

/**
 * Renders a form to set some advanced parameters for the BBHA algorithm.
 * @param props Component props.
 * @returns Component.
 */
export const BBHAAdvanced = (props: BBHAAdvancedProps) => {
    const intl = useIntl()
    const { advancedData, handleChangeAdvanceAlgorithm } = props
    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Form.Input
                        fluid
                        label={intl.formatMessage({ id: 'bbha.numberOfStars' })}
                        placeholder={intl.formatMessage({ id: 'common.integerPlaceholder' })}
                        type='number'
                        step={1}
                        min={minStarsBBHA}
                        max={maxStarsBBHA}
                        name='numberOfStars'
                        value={advancedData.numberOfStars}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)

                            if (numVal < minStarsBBHA || isNaN(numVal) || numVal > maxStarsBBHA) {
                                return
                            }

                            handleChangeAdvanceAlgorithm('BBHA', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={intl.formatMessage({ id: 'bbha.numberOfStars.info' })}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Form.Input
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

                            handleChangeAdvanceAlgorithm('BBHA', name, numVal)
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={intl.formatMessage({ id: 'bbha.numberOfIterations.info' })}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Form.Select
                        label={intl.formatMessage({ id: 'bbha.version' })}
                        className='selection-select'
                        options={advanceBBHAOptions}
                        value={advancedData.BBHAVersion}
                        onChange={(_, { value }) => handleChangeAdvanceAlgorithm('BBHA', 'BBHAVersion', Number(value))}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={(
                            <>
                                <p>
                                    {intl.formatMessage({ id: 'bbha.version.original' })}{' '}
                                    <ExternalLink href='https://www.sciencedirect.com/science/article/pii/S1568494617301242?via%3Dihub'>this article</ExternalLink>.
                                </p>
                                <p>
                                    {intl.formatMessage({ id: 'bbha.version.v2' })}{' '}
                                    <ExternalLink href='https://www.tandfonline.com/doi/full/10.1080/0305215X.2018.1540697'>newer article</ExternalLink>
                                </p>
                            </>
                        )}
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>

            {/* Improved BBHA version parameters */}
            {(advancedData.BBHAVersion === BBHAVersion.IMPROVED) && (
                <>
                    <Grid.Row columns={2}>
                        <Grid.Column width={14}>
                            <Form.Select
                                label={`${intl.formatMessage({ id: 'common.coefficient' })} 1`}
                                className='selection-select'
                                options={improvedBBHACoeff1Options}
                                value={advancedData.coeff1}
                                onChange={(_, { value }) => handleChangeAdvanceAlgorithm('BBHA', 'coeff1', Number(value))}
                            />
                        </Grid.Column>
                        <Grid.Column width={2} className='advance-center-container'>
                            <InfoPopup
                                content={CoeffExplanation}
                                onTop={false}
                            />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={2}>
                        <Grid.Column width={14}>
                            <Form.Select
                                label={`${intl.formatMessage({ id: 'common.coefficient' })} 2`}
                                className='selection-select'
                                options={improvedBBHACoeff2Options}
                                value={advancedData.coeff2}
                                onChange={(_, { value }) => handleChangeAdvanceAlgorithm('BBHA', 'coeff2', Number(value))}
                            />
                        </Grid.Column>
                        <Grid.Column width={2} className='advance-center-container'>
                            <InfoPopup
                                content={CoeffExplanation}
                                onTop={false}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </>
            )}

            {/* Apache Spark optimization */}
            {sparkIntegrationIsEnabled && (
                <Grid.Row columns={2}>
                    <Grid.Column width={14}>
                        <Checkbox
                            label='Try to optimize using Apache Spark'
                            checked={advancedData.useSpark}
                            onChange={(_e, { checked }) => { handleChangeAdvanceAlgorithm('BBHA', 'useSpark', checked ?? false) }}
                        />
                    </Grid.Column>
                    <Grid.Column width={2} className='advance-center-container'>
                        <InfoPopup
                            content={(
                                <p>
                                    If this option is enabled, the experiment will be executed (if possible) using <ExternalLink href='https://spark.apache.org/'>Apache Spark</ExternalLink> to optimize execution times
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
