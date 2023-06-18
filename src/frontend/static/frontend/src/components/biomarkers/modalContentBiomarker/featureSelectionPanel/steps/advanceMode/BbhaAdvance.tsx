import React from 'react'
import { Grid, Input, Select } from 'semantic-ui-react'
import { InfoPopup } from '../../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import './../../featureSelection.css'
import { advanceBBHAOptions } from '../../../../utils'
import { AdvanceBBHA } from '../../../../types'

interface Props {
    advanceData: AdvanceBBHA,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
}

export const BbhaAdvance = (props: Props) => {
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
                        label='Number of stars'
                        placeholder='An integer number'
                        type='number'
                        step={1}
                        min={10}
                        max={60}
                        name='numberOfStars'
                        value={advanceData.numberOfStars}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)
                            if (numVal < 10) {
                                handleChangeAdvanceAlgorithm('BBHA', name, 10)
                            } else if (numVal > 60) {
                                handleChangeAdvanceAlgorithm('BBHA', name, 60)
                            } else {
                                handleChangeAdvanceAlgorithm('BBHA', name, numVal)
                            }
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content='Number of stars in the Binary Black Hole Algorithm. Each of these stars evaluates a different subset of features. Increasing this number increases the chances of evaluating the most optimal subset but delays more the result of the experiment'
                        onTop={false}
                        onEvent='hover'
                        extraClassName=''
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
                        min={5}
                        max={40}
                        name='numberOfIterations'
                        value={advanceData.numberOfIterations}
                        onChange={(_, { name, value }) => {
                            const numVal = Number(value)
                            if (numVal < 5) {
                                handleChangeAdvanceAlgorithm('BBHA', name, 5)
                            } else if (numVal > 40) {
                                handleChangeAdvanceAlgorithm('BBHA', name, 40)
                            } else {
                                handleChangeAdvanceAlgorithm('BBHA', name, numVal)
                            }
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={2} className='advance-center-container'>
                    <InfoPopup
                        content='Number of iterations in the Binary Black Hole Algorithm. In each of the iterations, the fitness function for each of the stars with its corresponding subset of features is computed. Increasing this number allows to evaluate more combinations of features but delays more the result of the experiment'
                        onTop={false}
                        onEvent='hover'
                        extraClassName=''
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
                        content='The Original approach executes the original Binary Black Hole Algorithm as defined in this article. Version 2 it is an improved version defined in this newer article'
                        onTop={false}
                        onEvent='hover'
                        extraClassName=''
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
