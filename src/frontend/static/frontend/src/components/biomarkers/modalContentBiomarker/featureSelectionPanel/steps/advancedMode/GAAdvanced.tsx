import React from 'react'
import { Checkbox, Grid, Input } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import './../../featureSelection.css'
import { AdvancedGA } from '../../../../types'
import { ExternalLink } from '../../../../../common/ExternalLink'

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
    return (
        <Grid>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label='Population size'
                        placeholder='An integer number'
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
                        content='Number of candidate solutions (individuals or potential solutions) that coexist in each generation of the genetic algorithm. Increasing this number allows to evaluate more combinations of features but delays more the result of the experiment'
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={14}>
                    <Input
                        fluid
                        label='Mutation rate'
                        placeholder='An float number'
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
                        content='Determines the probability that a bit (binary digit) in a candidate solution will be altered or flipped randomly during the evolution process. This option introduces small random changes to explore new possibilities.'
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
                        content='Number of iterations in the Genetic Algorithms. In each of the iterations, the fitness function for each of the stars with its corresponding subset of features is computed. Increasing this number allows to evaluate more combinations of features but delays more the result of the experiment'
                        onTop={false}
                    />
                </Grid.Column>
            </Grid.Row>

            {/* Apache Spark optimization */}
            {sparkIntegrationIsEnabled &&
                <Grid.Row columns={2}>
                    <Grid.Column width={14}>
                        <Checkbox
                            label='Try to optimize using Apache Spark'
                            checked={advancedData.useSpark}
                            onChange={(_e, { checked }) => { handleChangeAdvanceAlgorithm('GA', 'useSpark', checked ?? false) }}
                        />
                    </Grid.Column>
                    <Grid.Column width={2} className='advance-center-container'>
                        <InfoPopup
                            content={
                                <p>
                                    If this option is enabled, the experiment will be executed (if possible) using <ExternalLink href='https://spark.apache.org/'>Apache Spark</ExternalLink> to optimize execution times
                                </p>}
                            onTop={false}
                        />
                    </Grid.Column>
                </Grid.Row>
            }
        </Grid>
    )
}
