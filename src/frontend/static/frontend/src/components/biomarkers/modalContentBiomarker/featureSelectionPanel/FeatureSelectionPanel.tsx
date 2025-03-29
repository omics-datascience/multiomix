import React from 'react'
import { Button, Grid, Icon, Modal, Segment, Step } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoUserFile, RowHeader } from '../../../../utils/django_interfaces'
import { Source, SourceType } from '../../../../utils/interfaces'
import { PaginationCustomFilter } from '../../../common/PaginatedTable'
import { Biomarker, CrossValidationParameters, FeatureSelectionAlgorithm, FeatureSelectionPanelData, FitnessFunction, FitnessFunctionParameters, SourceStateBiomarker } from '../../types'
import { FeatureSelectionStep1 } from './steps/FeatureSelectionStep1'
import { FeatureSelectionStep2 } from './steps/FeatureSelectionStep2'
import { FeatureSelectionStep3 } from './steps/FeatureSelectionStep3'
import './featureSelection.css'
import { experimentSourceIsValid } from '../../../../utils/util_functions'

/** FeatureSelectionPanel props. */
interface FeatureSelectionPanelProps {
    getDefaultFilters: PaginationCustomFilter[],
    featureSelection: FeatureSelectionPanelData,
    markBiomarkerAsSelected: (biomarker: Biomarker) => void,
    handleCompleteStep1: (selectedBiomarker: Biomarker) => void,
    handleCompleteStep2: () => void,
    selectNewFile: () => void,
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithm) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
    handleChangeCrossValidation: <T extends keyof CrossValidationParameters>(key: T, value: any) => void,
    handleGoBackStep1: () => void,
    handleGoBackStep2: () => void,
    submitFeatureSelectionExperiment: () => void,
    cancelForm: () => void,
    handleChangeAdvanceAlgorithm: (advanceAlgorithm: string, name: string, value: any) => void,
    handleSwitchAdvanceAlgorithm: () => void,
}

/**
 * Renders a panel with a lot of steps to make a Feature Selection experiment.
 * @param props Component props.
 * @returns Component.
 */
export const FeatureSelectionPanel = (props: FeatureSelectionPanelProps) => {
    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    const getDefaultHeaders = (): RowHeader<Biomarker>[] => [
        { name: 'Name', serverCodeToSort: 'name', width: 3 },
        { name: 'Description', serverCodeToSort: 'description', width: 4 },
        { name: 'Tag', serverCodeToSort: 'tag', width: 2 },
        { name: 'Date', serverCodeToSort: 'upload_date' },
        { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
        { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
        { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
        { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 }
    ]

    /**
     * Generate actions components depends of the step selected
     * @returns Components of step selected
     */
    const handleSectionActive = () => {
        switch (props.featureSelection.step) {
            case 1:
                return (
                    <FeatureSelectionStep1
                        defaultHeaders={getDefaultHeaders()}
                        customFilters={props.getDefaultFilters}
                        featureSelectionData={props.featureSelection}
                        markBiomarkerAsSelected={props.markBiomarkerAsSelected}
                        handleCompleteStep1={props.handleCompleteStep1}
                    />
                )
            case 2:
                return (
                    <FeatureSelectionStep2
                        featureSelection={props.featureSelection}
                        selectNewFile={props.selectNewFile}
                        selectStudy={props.selectStudy}
                        selectUploadedFile={props.selectUploadedFile}
                        handleChangeSourceType={props.handleChangeSourceType}
                    />
                )

            default:
                return (
                    <FeatureSelectionStep3
                        handleChangeAdvanceAlgorithm={props.handleChangeAdvanceAlgorithm}
                        featureSelection={props.featureSelection}
                        handleChangeAlgorithm={props.handleChangeAlgorithm}
                        handleChangeFitnessFunction={props.handleChangeFitnessFunction}
                        handleChangeFitnessFunctionOption={props.handleChangeFitnessFunctionOption}
                        handleChangeCrossValidation={props.handleChangeCrossValidation}
                        handleSwitchAdvanceAlgorithm={props.handleSwitchAdvanceAlgorithm}
                    />
                )
        }
    }

    /**
     * Validate if the source validation applies
     * @param condition Condition to check
     * @param source Source to validate
     * @returns True if applies or if it not necessary to validate
     */
    const checkIfSourceApplies = (condition: number | undefined, source: Source) => {
        if (!condition) {
            return true
        }

        return experimentSourceIsValid(source)
    }

    /**
     * Function to check if the source are validated
     * @returns True if the clinical source is valid and experiments sources if each one applies
     */
    const allSourcesAreValid = () => {
        const mirnaValidation = checkIfSourceApplies(props.featureSelection.biomarker?.number_of_mirnas, props.featureSelection.mirnaSource)
        const cnaValidation = checkIfSourceApplies(props.featureSelection.biomarker?.number_of_cnas, props.featureSelection.cnaSource)
        const methylationValidation = checkIfSourceApplies(props.featureSelection.biomarker?.number_of_methylations, props.featureSelection.methylationSource)
        const mRNAValidation = checkIfSourceApplies(props.featureSelection.biomarker?.number_of_mrnas, props.featureSelection.mRNASource)

        return experimentSourceIsValid(props.featureSelection.clinicalSource) &&
            mirnaValidation &&
            cnaValidation &&
            methylationValidation &&
            mRNAValidation
    }

    /**
     * Function to validate if the confirm button can be used
     * @returns True if the condition is validated
     */
    const handleVerifyDisabled = () => {
        switch (props.featureSelection.step) {
            case 1:
                return props.featureSelection.selectedBiomarker === null
            case 2:
                return !allSourcesAreValid()
            case 3:
                return false // TODO: implement
            default:
                return true
        }
    }

    /**
     * validate logic and condition to go back to a step
     * @param action function that handle which step go
     * @param condition check if the action can be execute
     */
    const handleGoBackPanel = (action: () => void, condition: boolean) => {
        if (condition) {
            action()
        }
    }

    /**
     * check which action execute depends of step
     */
    const handleConfirm = () => {
        switch (props.featureSelection.step) {
            case 1:
                props.handleCompleteStep1(props.featureSelection.selectedBiomarker as Biomarker)
                break
            case 2:
                props.handleCompleteStep2()
                break
            case 3:
                props.submitFeatureSelectionExperiment()
                break
            default:
                break
        }
    }

    return (
        <>
            <Modal.Content>
                <Grid verticalAlign='middle'>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Step.Group widths={3}>
                                <Step active={props.featureSelection.step === 1} completed={props.featureSelection.step > 1} onClick={() => handleGoBackPanel(props.handleGoBackStep1, props.featureSelection.step > 1)}>
                                    <Icon name='list' />
                                    <Step.Content>
                                        <Step.Title>Step 1: {props.featureSelection.biomarker?.id ? `Selected ${props.featureSelection.biomarker?.name}` : 'Select biomarker'}</Step.Title>
                                    </Step.Content>
                                </Step>
                                <Step active={props.featureSelection.step === 2} completed={props.featureSelection.step > 2} disabled={props.featureSelection.step === 1} onClick={() => handleGoBackPanel(props.handleGoBackStep2, props.featureSelection.step > 2)}>
                                    <Icon name='boxes' />
                                    <Step.Content>
                                        <Step.Title>Step 2: Datasets</Step.Title>
                                    </Step.Content>
                                </Step>
                                <Step active={props.featureSelection.step === 3} completed={props.featureSelection.step > 3} disabled={props.featureSelection.step < 3}>
                                    <Icon name='lab' />
                                    <Step.Content>
                                        <Step.Title>Step 3: Feature selection</Step.Title>
                                    </Step.Content>
                                </Step>
                            </Step.Group>
                        </Grid.Column>
                    </Grid.Row>

                    {/* Active section */}
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Segment>
                                {handleSectionActive()}
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    color='red'
                    onClick={props.cancelForm}
                >
                    Cancel
                </Button>
                <Button
                    color='green'
                    onClick={handleConfirm}
                    disabled={handleVerifyDisabled()}
                >
                    Confirm
                </Button>
            </Modal.Actions>
        </>
    )
}
