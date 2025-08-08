import React, { useState } from 'react'
import { Form, Header, Icon, Input, Label, Segment, TextArea } from 'semantic-ui-react'
import { SourceForm } from '../pipeline/SourceForm'
import { SingleRangeSlider } from 'neo-react-semantic-ui-range'
import { FileType, Source, SourceType } from '../../utils/interfaces'
import { cleanRef, getDefaultSource, getFilenameFromSource } from '../../utils/util_functions'
import { DjangoCGDSStudy, DjangoUserFile } from '../../utils/django_interfaces'

interface IDifferentialExpressionForm extends IDifferentialExpressionFormData {
    isEditing: boolean
}

/** Available types of Sources for a DifferentialExpressionForm. */
type SourceStateDifferentialExpression = 'clinicalSource' | 'mRNASource'

/** Structure for the Feature Selection panel. */
interface IDifferentialExpressionFormData {
    /** mRNA source. */
    mRNASource: Source,
    /** clinical source. */
    clinicalSource: Source,
    /** Differential Expression name. */
    differentialExpressionDescription: string,
    /** Differential Expression description. */
    differentialExpressionName: string,
    /** Percentile threshold. */
    percentileThreshold: number,

}
const cleanForm: IDifferentialExpressionForm = {
    mRNASource: getDefaultSource(),
    clinicalSource: getDefaultSource(),
    isEditing: false,
    differentialExpressionDescription: '',
    differentialExpressionName: '',
    percentileThreshold: 0.15,
}

export const DifferentialExpressionForm = () => {
    const [form, setForm] = useState<IDifferentialExpressionForm>(cleanForm);

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    const handleChangeSourceType = (sourceType: SourceType, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]
        // Change source type
        source.type = sourceType

        // Resets all source values
        source.selectedExistingFile = null
        source.CGDSStudy = null
        cleanRef(source.newUploadedFileRef)
        console.log(source)
        console.log('---')
        // After update state
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))
        console.log(form)
        console.log('---')

        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]

        source.type = SourceType.UPLOADED_DATASETS
        source.selectedExistingFile = selectedFile
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))
        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]

        source.type = SourceType.CGDS
        source.CGDSStudy = selectedStudy
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))
        updateSourceFilenamesAndCommonSamples()
    }


    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    const updateSourceFilenames = () => {
        setForm(prevState => ({
            ...prevState,
            clinicalSource: {
                ...prevState.clinicalSource,
                filename: getFilenameFromSource(prevState.clinicalSource)
            },
            mRNASource: {
                ...prevState.mRNASource,
                filename: getFilenameFromSource(prevState.mRNASource)
            },

        }))
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    const updateSourceFilenamesAndCommonSamples = () => {
        updateSourceFilenames()
    }


    /**
 * Callback when a new file is selected in the uncontrolled component
 * (input type=file)
 */
    const selectNewFile = () => { updateSourceFilenamesAndCommonSamples() }

    /**
     * change name or description of manual form
     * @param value new value for input form
     * @param name type of input to change
     */
    const handleChangeForm = (value: string | number, name: 'differentialExpressionName' | 'differentialExpressionDescription' | 'coefficientThreshold') => {
        setForm(prevState => ({
            ...prevState,
            [name]: value,
        }))
    }

    return (
        <Segment className='diff--side--bar--container table-bordered'>
            <Header textAlign='center' className='margin-top-0'>
                <Icon name='th' />
                <Header.Content>New Differential Expression</Header.Content>
            </Header>
            <Input
                onChange={(e) => handleChangeForm(e.target.value, 'differentialExpressionName')}
                type='text'
                placeholder='Name'
                className='diff--side--bar--container--item--margin'
                value={form.differentialExpressionName}
                icon='asterisk'
            />

            <TextArea
                style={{ maxWidth: '100%', minWidth: '100%' }}
                rows={3}
                onChange={(_, e) => handleChangeForm(e.value ? e.value.toString() : '', 'differentialExpressionDescription')}
                placeholder='Description'
                className='diff--side--bar--container--item--margin'
                value={form.differentialExpressionDescription}
            />
            {/* mRNA SourceForm */}
            <SourceForm
                source={form.mRNASource}
                headerTitle='mRNA profile'
                headerIcon={{
                    type: 'img',
                    src: 'static/frontend/img/profiles/mRNA.svg'
                }}
                fileType={FileType.MRNA}
                disabled={form.isEditing}
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
            {/* Clinical SourceForm */}
            <SourceForm
                source={form.clinicalSource}
                headerTitle='Clinical profile'
                headerIcon={{
                    type: 'img',
                    src: '/static/frontend/img/profiles/mRNA.svg'
                }}
                fileType={FileType.CLINICAL}
                disabled={form.isEditing}
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

            <Form.Field width={6}>
                <Label
                    id='slider-cor-filter-label'
                    className='align-center bolder'
                >
                    Percentile threshold {form.percentileThreshold.toFixed(2)}
                </Label>

                <SingleRangeSlider
                    value={form.percentileThreshold}
                    color='green'
                    defaultMinValue={0}
                    className='margin-bottom-5'
                    defaultMaxValue={1}
                    step={0.05}
                    onChange={(value: number) => handleChangeForm(value, 'coefficientThreshold')}
                />

                <Label
                    id='label-minimum-threshold'
                    color='green'
                    className='pull-left'
                >
                    {form.percentileThreshold.toFixed(2)}
                </Label>
                <Label color='green' className='pull-right'>1</Label>
            </Form.Field>
        </Segment>
    )
}
