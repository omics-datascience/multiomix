import React from 'react'
import { Button } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../../utils/django_interfaces'
import { FileType, SourceType } from '../../../../../utils/interfaces'
import { SourceForm } from '../../../../pipeline/SourceForm'
import { FeatureSelectionPanelData, SourceStateBiomarker } from '../../../types'
import './../featureSelection.css'

/** FeatureSelectionStep2 props. */
interface FeatureSelectionStep2Props {
    featureSelection: FeatureSelectionPanelData,
    selectNewFile: () => void,
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
    handleCompleteStep2: () => void,
    handleGoBackStep1: () => void,
}

export const FeatureSelectionStep2 = (props: FeatureSelectionStep2Props) => {
    const {
        featureSelection,
        handleChangeSourceType,
        selectNewFile,
        selectUploadedFile,
        selectStudy,
        handleCompleteStep2,
        handleGoBackStep1
    } = props
    return (
        <>
            <div className='selections-grid-container'>
                <SourceForm
                    source={featureSelection.clinicalSource}
                    headerTitle='clinical profile'
                    headerIcon={{
                        type: 'img',
                        src: '/static/frontend/img/profiles/mRNA.svg'
                    }}
                    fileType={FileType.CLINICAL}
                    disabled={false}
                    tagOptions={[]}
                    handleChangeSourceType={(selectedSourceType) => {
                        handleChangeSourceType(selectedSourceType, 'clinicalSource')
                    }}
                    selectNewFile={selectNewFile}
                    selectUploadedFile={(selectedFile) => {
                        selectUploadedFile(selectedFile, 'clinicalSource')
                    }}
                    selectStudy={(selectedStudy) => {
                        selectStudy(selectedStudy, 'clinicalSource')
                    }}
                />

                {/* mRNA */}
                <SourceForm
                    source={featureSelection.mRNASource}
                    headerTitle='mRNA profile'
                    headerIcon={{
                        type: 'img',
                        src: '/static/frontend/img/profiles/mRNA.svg'
                    }}
                    fileType={FileType.MRNA}
                    disabled={!featureSelection.selectedBiomarker?.number_of_mrnas}
                    tagOptions={[]}
                    handleChangeSourceType={(selectedSourceType) => {
                        handleChangeSourceType(selectedSourceType, 'mRNASource')
                    }}
                    selectNewFile={selectNewFile}
                    selectUploadedFile={(selectedFile) => {
                        selectUploadedFile(selectedFile, 'mRNASource')
                    }}
                    selectStudy={(selectedStudy) => {
                        selectStudy(selectedStudy, 'mRNASource')
                    }}
                />

                {/* miRNA */}
                <SourceForm
                    source={featureSelection.mirnaSource}
                    headerTitle='mirna profile'
                    headerIcon={{
                        type: 'img',
                        src: '/static/frontend/img/profiles/miRNA.svg'
                    }}
                    fileType={FileType.MIRNA}
                    disabled={!featureSelection.selectedBiomarker?.number_of_mirnas}
                    tagOptions={[]}
                    handleChangeSourceType={(selectedSourceType) => {
                        handleChangeSourceType(selectedSourceType, 'mirnaSource')
                    }}
                    selectNewFile={selectNewFile}
                    selectUploadedFile={(selectedFile) => {
                        selectUploadedFile(selectedFile, 'mirnaSource')
                    }}
                    selectStudy={(selectedStudy) => {
                        selectStudy(selectedStudy, 'mirnaSource')
                    }}
                />

                {/* CNA */}
                <SourceForm
                    source={featureSelection.cnaSource}
                    headerTitle='cna profile'
                    headerIcon={{
                        type: 'img',
                        src: '/static/frontend/img/profiles/CNA.svg'
                    }}
                    fileType={FileType.CNA}
                    disabled={!featureSelection.selectedBiomarker?.number_of_cnas}
                    tagOptions={[]}
                    handleChangeSourceType={(selectedSourceType) => {
                        handleChangeSourceType(selectedSourceType, 'cnaSource')
                    }}
                    selectNewFile={selectNewFile}
                    selectUploadedFile={(selectedFile) => {
                        selectUploadedFile(selectedFile, 'cnaSource')
                    }}
                    selectStudy={(selectedStudy) => {
                        selectStudy(selectedStudy, 'cnaSource')
                    }}
                />

                {/* Methylation */}
                <SourceForm
                    source={featureSelection.methylationSource}
                    headerTitle='methylation profile'
                    headerIcon={{
                        type: 'img',
                        src: '/static/frontend/img/profiles/methylation.svg'
                    }}
                    fileType={FileType.METHYLATION}
                    disabled={!featureSelection.selectedBiomarker?.number_of_methylations}
                    tagOptions={[]}
                    handleChangeSourceType={(selectedSourceType) => {
                        handleChangeSourceType(selectedSourceType, 'methylationSource')
                    }}
                    selectNewFile={selectNewFile}
                    selectUploadedFile={(selectedFile) => {
                        selectUploadedFile(selectedFile, 'methylationSource')
                    }}
                    selectStudy={(selectedStudy) => {
                        selectStudy(selectedStudy, 'methylationSource')
                    }}
                />
            </div>
            <Button
                color="red"
                onClick={() => handleGoBackStep1()}
            >
                Go back
            </Button>
            <Button
                color="green"
                onClick={() => handleCompleteStep2()}
                disabled={props.featureSelection.clinicalSource === null}
            >
                Confirm
            </Button>
        </>
    )
}
