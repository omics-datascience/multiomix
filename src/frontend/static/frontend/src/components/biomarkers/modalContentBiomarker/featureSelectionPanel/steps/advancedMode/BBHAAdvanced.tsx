import React from 'react'
import { Grid, Input, Select } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import './../../featureSelection.css'
import { advanceBBHAOptions } from '../../../../utils'
import { AdvancedBBHA } from '../../../../types'
import { ExternalLink } from '../../../../../common/ExternalLink'

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
 * Renders a form to set some advanced parameters for the BBHA algorithm.
 * @param props Component props.
 * @returns Component.
 */
export const BBHAAdvanced = (props: BBHAAdvancedProps) => {
    const {
        advancedData: advanceData,
        handleChangeAdvanceAlgorithm
    } = props
    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label='Number of stars'
                        placeholder='An integer number'
                        type='number'
                        step={1}
                        min={minStarsBBHA}
                        max={maxStarsBBHA}
                        name='numberOfStars'
                        value={advanceData.numberOfStars}
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
                        content='Number of stars in the Binary Black Hole Algorithm. Each of these stars evaluates a different subset of features. Increasing this number increases the chances of evaluating the most optimal subset but delays more the result of the experiment'
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label='Number of iterations'
                        placeholder='An integer number'
                        type='number'
                        step={1}
                        min={minIterationsMetaheuristics}
                        max={maxIterationsMetaheuristics}
                        name='numberOfIterations'
                        value={advanceData.numberOfIterations}
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
                        content='Number of iterations in the Binary Black Hole Algorithm. In each of the iterations, the fitness function for each of the stars with its corresponding subset of features is computed. Increasing this number allows to evaluate more combinations of features but delays more the result of the experiment'
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Select
                        label='BBHAVersion'
                        className='selection-select'
                        placeholder='Fitness function'
                        options={advanceBBHAOptions}
                        value={advanceData.BBHAVersion}
                        onChange={(_, { value }) => handleChangeAdvanceAlgorithm('BBHA', 'BBHAVersion', Number(value))}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content={
                            <>
                                <p>
                                    The <i>Original</i> approach executes the original Binary Black Hole Algorithm as defined in <ExternalLink href='https://www.sciencedirect.com/science/article/pii/S1568494617301242?via%3Dihub'>this article</ExternalLink>.
                                </p>
                                <p>
                                    <i>Version 2</i> it is an improved version defined in this <ExternalLink href='https://www.tandfonline.com/doi/full/10.1080/0305215X.2018.1540697'>newer article</ExternalLink>
                                </p>
                            </>
                        }
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
