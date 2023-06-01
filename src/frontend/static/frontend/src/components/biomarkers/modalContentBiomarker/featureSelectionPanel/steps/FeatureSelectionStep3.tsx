import React from 'react'
import { Button, Grid, Segment, Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithm, FeatureSelectionPanelData, FitnessFunction } from '../../../types'
import { BlindSearchPanel } from './BlindSearchPanel'
import './../featureSelection.css'
import { BbhaAdvance } from './advanceMode/BbhaAdvance'
import { CoxRegressionAdvance } from './advanceMode/CoxRegressionAdvance'

/** FeatureSelectionStep3 props. */
interface FeatureSelectionStep3Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithm) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSVMOption: (key: string, value: number) => void,
    handleChangeRFOption: (key: string, value: number) => void,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
    handleSwitchAdvanceAlgorithm: () => void,
}

export const FeatureSelectionStep3 = (props: FeatureSelectionStep3Props) => {
    const {
        featureSelection,
        handleChangeAlgorithm,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSVMOption,
        handleChangeRFOption,
        handleChangeAdvanceAlgorithm,
        handleSwitchAdvanceAlgorithm
    } = props
    const algorithmSelection = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithm.BLIND_SEARCH:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            case FeatureSelectionAlgorithm.BBHA:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            case FeatureSelectionAlgorithm.COX_REGRESSION:
                return (
                    <></>
                )
            case FeatureSelectionAlgorithm.PSO:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            default:
                return null
        }
    }
    const advanceMode = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithm.BLIND_SEARCH:
                return (
                    <></>
                )
            case FeatureSelectionAlgorithm.BBHA:
                return (
                    <BbhaAdvance
                        advanceData={featureSelection.advanceAlgorithm.BBHA}
                        handleChangeAdvanceAlgorithm={handleChangeAdvanceAlgorithm}
                    />
                )
            case FeatureSelectionAlgorithm.COX_REGRESSION:
                return (
                    <CoxRegressionAdvance
                        advanceData={featureSelection.advanceAlgorithm.coxRegression}
                        handleChangeAdvanceAlgorithm={handleChangeAdvanceAlgorithm}

                    />
                )
            case FeatureSelectionAlgorithm.PSO:
                return (
                    <></>
                )
            default:
                return null
        }
    }

    return (
        <div className='selection-step-container selection-step-algorithm'>
            <div className='selection-step-container-selection-confg'>
                <Select
                    selectOnBlur={false}
                    className='selection-select selection-all-space'
                    placeholder='Algorithm'
                    name='moleculeSelected'
                    options={[
                        { key: FeatureSelectionAlgorithm.BLIND_SEARCH, text: 'Blind Search', value: FeatureSelectionAlgorithm.BLIND_SEARCH },
                        { key: FeatureSelectionAlgorithm.BBHA, text: 'BBHA', value: FeatureSelectionAlgorithm.BBHA },
                        { key: FeatureSelectionAlgorithm.COX_REGRESSION, text: 'Cox Regression', value: FeatureSelectionAlgorithm.COX_REGRESSION },
                        { key: FeatureSelectionAlgorithm.PSO, text: 'PSO', value: FeatureSelectionAlgorithm.PSO, disabled: true }
                    ]}
                    value={featureSelection.algorithm}
                    onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithm)}
                />
                <Button
                    toggle
                    active={featureSelection.advanceAlgorithm.isActive}
                    onClick={() => handleSwitchAdvanceAlgorithm()}
                    className='selection-step-button-advance-mode'
                >
                    Expert mode
                </Button>
            </div>
            <Segment>
                <Grid>
                    <Grid.Row columns={2} divided>
                        <Grid.Column width={featureSelection.advanceAlgorithm.isActive ? 10 : 16}>
                            {algorithmSelection()}
                        </Grid.Column>
                        <Grid.Column width={featureSelection.advanceAlgorithm.isActive ? 6 : undefined}>
                            {featureSelection.advanceAlgorithm.isActive ? advanceMode() : <></>}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>
        </div>
    )
}
