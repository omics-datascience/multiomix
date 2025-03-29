import React from 'react'
import { SourceStateBiomarker } from '../biomarkers/types'
import { DjangoCGDSStudy, DjangoUserFile } from '../../utils/django_interfaces'
import { SourceType, FileType, Source } from '../../utils/interfaces'
import { SourceForm } from '../pipeline/SourceForm'
import { Grid } from 'semantic-ui-react'

/** Structure to handle a Source in this component. */
type SourceFormData = {
    /** Source to handle. */
    source: Source,
    /** Disabled prop of the SourceForm. */
    disabled?: boolean
}

/** SourceSelectors props. */
interface SourceSelectorsProps {
    /** Clinical source. */
    clinicalSource?: SourceFormData,
    /** mRNA source. If `undefined` the SourceForm is not shown. */
    mRNASource?: SourceFormData,
    /** mirna source. If `undefined` the SourceForm is not shown. */
    mirnaSource?: SourceFormData,
    /** CNA source. If `undefined` the SourceForm is not shown. */
    cnaSource?: SourceFormData,
    /** Methylation source. If `undefined` the SourceForm is not shown. */
    methylationSource?: SourceFormData,
    /** Function callback when a file is selected from Dataset Modal */
    selectNewFile: () => void,
    /** Function callback when a study is selected from CGDS Modal */
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    /** Function callback when a new file is selected from OS browser window */
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    /** Function callback to handle changes in source select types */
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
}

/**
 * Renders a selector for every type of Source.
 * @param props Component props.
 * @returns Component.
 */
export const SourceSelectors = (props: SourceSelectorsProps) => {
    const {
        handleChangeSourceType,
        selectNewFile,
        selectUploadedFile,
        selectStudy
    } = props

    return (
        <>
            <Grid stackable>
                <Grid.Row stretched columns={5}>
                    <Grid.Column>
                        {props.clinicalSource !== undefined &&
                            <SourceForm
                                source={props.clinicalSource.source}
                                headerTitle='Clinical profile'
                                headerIcon={{
                                    type: 'img',
                                    src: '/static/frontend/img/profiles/mRNA.svg'
                                }}
                                fileType={FileType.CLINICAL}
                                disabled={props.clinicalSource.disabled}
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
                            />}
                    </Grid.Column>
                    {/* mRNA */}
                    <Grid.Column>
                        {props.mRNASource !== undefined &&
                            <SourceForm
                                source={props.mRNASource.source}
                                headerTitle='mRNA profile'
                                headerIcon={{
                                    type: 'img',
                                    src: '/static/frontend/img/profiles/mRNA.svg'
                                }}
                                fileType={FileType.MRNA}
                                disabled={props.mRNASource.disabled}
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
                            />}
                    </Grid.Column>
                    {/* miRNA */}
                    <Grid.Column>
                        {props.mirnaSource !== undefined &&
                            <SourceForm
                                source={props.mirnaSource.source}
                                headerTitle='Mirna profile'
                                headerIcon={{
                                    type: 'img',
                                    src: '/static/frontend/img/profiles/miRNA.svg'
                                }}
                                fileType={FileType.MIRNA}
                                disabled={props.mirnaSource.disabled}
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
                            />}
                    </Grid.Column>
                    <Grid.Column>
                        {/* CNA */}
                        {props.cnaSource !== undefined &&
                            <SourceForm
                                source={props.cnaSource.source}
                                headerTitle='CNA profile'
                                headerIcon={{
                                    type: 'img',
                                    src: '/static/frontend/img/profiles/CNA.svg'
                                }}
                                fileType={FileType.CNA}
                                disabled={props.cnaSource.disabled}
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
                            />}
                    </Grid.Column>
                    <Grid.Column>
                        {/* Methylation */}
                        {props.methylationSource !== undefined &&
                            <SourceForm
                                source={props.methylationSource.source}
                                headerTitle='Methylation profile'
                                headerIcon={{
                                    type: 'img',
                                    src: '/static/frontend/img/profiles/methylation.svg'
                                }}
                                fileType={FileType.METHYLATION}
                                disabled={props.methylationSource.disabled}
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
                            />}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    )
}
