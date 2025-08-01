import React from 'react'
import { Input, TextArea } from 'semantic-ui-react'
import { SourceForm } from '../pipeline/SourceForm'

export const DifferentialExpressionForm = () => {
    return (
        <div>
            <Input placeholder='Search...' />
            <TextArea placeholder='Tell us more' />
            {/* mRNA SourceForm */}
           {/*  <SourceForm
                source={newExperiment.mRNASource}
                headerTitle='mRNA profile'
                headerIcon={{
                    type: 'img',
                    src: 'static/frontend/img/profiles/mRNA.svg'
                }}
                fileType={FileType.MRNA}
                disabled={isEditing}
                tagOptions={this.props.tagOptions}
                handleChangeSourceType={(selectedSourceType) => {
                    this.props.handleChangeSourceType(selectedSourceType, 'mRNASource')
                }}
                selectNewFile={this.props.selectNewFile}
                selectUploadedFile={(selectedFile) => {
                    this.props.selectUploadedFile(selectedFile, 'mRNASource')
                }}
                selectStudy={(selectedStudy) => {
                    this.props.selectStudy(selectedStudy, 'mRNASource')
                }}
            /> */}
            {/* Clinical SourceForm */}
           {/*  <SourceForm
                source={newExperiment.mRNASource}
                headerTitle='mRNA profile'
                headerIcon={{
                    type: 'img',
                    src: 'static/frontend/img/profiles/mRNA.svg'
                }}
                fileType={FileType.MRNA}
                disabled={isEditing}
                tagOptions={this.props.tagOptions}
                handleChangeSourceType={(selectedSourceType) => {
                    this.props.handleChangeSourceType(selectedSourceType, 'mRNASource')
                }}
                selectNewFile={this.props.selectNewFile}
                selectUploadedFile={(selectedFile) => {
                    this.props.selectUploadedFile(selectedFile, 'mRNASource')
                }}
                selectStudy={(selectedStudy) => {
                    this.props.selectStudy(selectedStudy, 'mRNASource')
                }}
            /> */}
        </div>
    )
}
