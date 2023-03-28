import React from 'react'
import { Icon, Segment, Step } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoUserFile, RowHeader } from '../../../../utils/django_interfaces'
import { SourceType } from '../../../../utils/interfaces'
import { PaginationCustomFilter } from '../../../common/PaginatedTable'
import { Biomarker, FeatureSelectionPanelData, SourceStateBiomarker } from '../../types'
import { FeatureSelectionStep1 } from './steps/FeatureSelectionStep1'
import { FeatureSelectionStep2 } from './steps/FeatureSelectionStep2'
import { FeatureSelectionStep3 } from './steps/FeatureSelectionStep3'

interface FeatureSelectionPanelProps {
    getDefaultFilters: PaginationCustomFilter[],
    urlBiomarkersCRUD: string,
    featureSelection: FeatureSelectionPanelData,
    markBiomarkerAsSelected: (biomarker: Biomarker) => void,
    handleCompleteStep1: (selectedBiomarker: Biomarker) => void,
    handleCompleteStep2: () => void,
    selectNewFile: () => void,
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
}

/**
 * Generates default table's headers
 * @returns Default object for table's headers
 */
function getDefaultHeaders (): RowHeader<Biomarker>[] {
    return [
        { name: 'Name', serverCodeToSort: 'name', width: 3 },
        { name: 'Description', serverCodeToSort: 'description', width: 4 },
        { name: 'Tag', serverCodeToSort: 'tag', width: 2 },
        { name: 'Date', serverCodeToSort: 'upload_date' },
        { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
        { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
        { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
        { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 }
    ]
}
export const FeatureSelectionPanel = (props: FeatureSelectionPanelProps) => {
    const handleSectionActive = () => {
        switch (props.featureSelection.step) {
            case 1:
                return (<FeatureSelectionStep1
                    getDefaultHeaders={getDefaultHeaders}
                    getDefaultFilters={props.getDefaultFilters}
                    urlBiomarkersCRUD={props.urlBiomarkersCRUD}
                    featureSelection={props.featureSelection}
                    markBiomarkerAsSelected={props.markBiomarkerAsSelected}
                    handleCompleteStep1={props.handleCompleteStep1}
                />)
            case 2:
                return (<FeatureSelectionStep2
                    featureSelection={props.featureSelection}
                    selectNewFile={props.selectNewFile}
                    selectStudy={props.selectStudy}
                    selectUploadedFile={props.selectUploadedFile}
                    handleChangeSourceType={props.handleChangeSourceType}
                    handleCompleteStep2={props.handleCompleteStep2}
                />)

            default:
                return (<FeatureSelectionStep3
                    featureSelection={props.featureSelection}
                />)
        }
    }
    return (
        <div>
            <Step.Group widths={3}>
                <Step active={props.featureSelection.step === 1} completed={props.featureSelection.step > 1} disabled={props.featureSelection.step > 1}>
                    <Icon name='truck' />
                    <Step.Content>
                        <Step.Title>Step 1: {props.featureSelection.biomarker?.id ? `Selected ${props.featureSelection.biomarker?.name}` : 'Select biomarker'}</Step.Title>
                    </Step.Content>
                </Step>
                <Step active={props.featureSelection.step === 2} completed={props.featureSelection.step > 2} disabled={props.featureSelection.step < 2}>
                    <Icon name='credit card' />
                    <Step.Content>
                        <Step.Title>Step 2: Datasets</Step.Title>
                    </Step.Content>
                </Step>
                <Step active={props.featureSelection.step === 3} completed={props.featureSelection.step > 3} disabled={props.featureSelection.step < 3}>
                    <Icon name='info' />
                    <Step.Content>
                        <Step.Title>Step 3: Feature selection</Step.Title>
                    </Step.Content>
                </Step>
            </Step.Group>
            <Segment>
                {
                    handleSectionActive()
                }
            </Segment>
        </div>
    )
}
