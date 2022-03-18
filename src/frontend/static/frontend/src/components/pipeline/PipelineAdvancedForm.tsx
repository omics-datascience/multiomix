import React, { useState } from 'react'
import { Form, Select, Label, Icon, PopupContentProps } from 'semantic-ui-react'
import { Slider } from 'react-semantic-ui-range'
import { NewExperiment, FileType } from '../../utils/interfaces'
import { getCorrelationMethodSelectOptions, getAdjustmentMethodSelectOptions } from '../../utils/util_functions'
import { InfoPopup } from './experiment-result/gene-gem-details/InfoPopup'
import { SemanticShorthandItem } from 'semantic-ui-react/dist/commonjs/generic'
import { CorrelationMethod } from '../../utils/django_interfaces'

/** Minimum value possible for minimum correlation threshold Slider */
const MIN_VALUE_CORRELATION = 0.5

/**
 * LabelWithInfoPopup's props
 */
interface LabelWithInfoPopupProps {
    labelText: string,
    popupContent: SemanticShorthandItem<PopupContentProps>,
    centered?: boolean
}

/**
 * Renders an label with an info popup. It's defined here for simplicity and reusability
 * @param props Component's props
 * @returns Component
 */
const LabelWithInfoPopup = (props: LabelWithInfoPopupProps) => (
    <Label className={'full-width' + (props.centered ? ' align-center' : '')}>
        {props.labelText}

        <InfoPopup
            content={props.popupContent}
            onTop={false}
            extraClassName='margin-left-2 no-margin-right pull-right'
        />
    </Label>
)

/**
 * Component's props
 */
interface PipelineAdvancedFormProps {
    /** New experiment settings to show the options */
    newExperiment: NewExperiment,
    /** To enable/disable some inputs */
    isEditing: boolean,
    /** GEM description to show */
    gemDescription: string,
    /** To check if we need to show some GEM extra fields */
    gemFileType: FileType
    /** Callback to handle advance form changes */
    handleFormInputsChange: (name: string, value) => void
}

/**
 * Renders the advanced part of the Pipeline form
 * @param props Component's props
 * @returns Component
 */
export const PipelineAdvancedForm = (props: PipelineAdvancedFormProps) => {
    const [showAdvancedSettings, setShowAdvancedSetting] = useState<boolean>(false)

    // Generates Slider settings
    const generalSliderSettings = {
        start: props.newExperiment.correlationCoefficient,
        min: 0.0,
        max: 0.99,
        step: 0.05
    }

    const correlationSliderSettings = {
        ...generalSliderSettings,
        min: MIN_VALUE_CORRELATION,
        onChange: (newValue: number) => props.handleFormInputsChange('correlationCoefficient', newValue)
    }

    const stdGeneSliderSettings = {
        ...generalSliderSettings,
        onChange: (newValue: number) => props.handleFormInputsChange('standardDeviationGene', newValue)
    }

    const stdGemSliderSettings = {
        ...generalSliderSettings,
        onChange: (newValue: number) => props.handleFormInputsChange('standardDeviationGEM', newValue)
    }

    // Generates cor. method Select options
    const selectCorrelationMethodsOptions = getCorrelationMethodSelectOptions(false)

    // Generates p-values adjustment method Select options
    const selectAdjustmentMethodsOptions = getAdjustmentMethodSelectOptions()

    const correlationCoefficientFormatted = props.newExperiment.correlationCoefficient.toFixed(2)
    const geneStdFormatted = props.newExperiment.standardDeviationGene.toFixed(2)
    const gemStdFormatted = props.newExperiment.standardDeviationGEM.toFixed(2)

    return (
        <React.Fragment>
            <div
                className='clickable margin-bottom-5'
                onClick={() => setShowAdvancedSetting(!showAdvancedSettings)}
            >
                <Icon name={showAdvancedSettings ? 'chevron down' : 'chevron right'} /> <strong>Advanced Settings</strong>
            </div>

            {showAdvancedSettings &&
                <Form className='margin-bottom-5'>
                    {/* Correlation method */}
                    <Form.Field>
                        <LabelWithInfoPopup
                            labelText='Correlation method'
                            popupContent='Correlation method to use: Pearson, Spearman or Kendall (Tau-b). You can see if the selected method is appropriated for your data in the Assumptions panel in the result view once the experiment has finished'
                        />

                        <Select
                            fluid
                            className="margin-top-5"
                            options={selectCorrelationMethodsOptions}
                            name='correlationMethod'
                            value={props.newExperiment.correlationMethod}
                            onChange={(_, { name, value }) => props.handleFormInputsChange(name, value)}
                            disabled={props.isEditing}
                        />
                    </Form.Field>

                    {/* For Methylation only: if it will be a all vs all of only Methylation/CNA genes = Genes */}
                    {props.gemFileType !== FileType.MIRNA &&
                        <React.Fragment>
                            <LabelWithInfoPopup
                                labelText='Correlate...'
                                popupContent='You can choose whether to keep only the combinations whose genes match or to keep all the combinations resulting from the experiment'
                            />

                            <Form.Radio
                                className='margin-top-5'
                                label={`... ${props.gemDescription}s with expression of only its genes`}
                                name='correlateWithAllGenes'
                                checked={!props.newExperiment.correlateWithAllGenes}
                                onChange={(_, { name }) => props.handleFormInputsChange(name as string, false)}
                                disabled={props.isEditing}
                            />
                            <Form.Radio
                                label={`... all ${props.gemDescription}s with all genes`}
                                name='correlateWithAllGenes'
                                checked={props.newExperiment.correlateWithAllGenes}
                                onChange={(_, { name }) => props.handleFormInputsChange(name as string, true)}
                                /* FIXME: disabled all vs all for Kendall until https://github.com/zolkko/kendalls/issues/2 is fixed */
                                disabled={props.isEditing || props.newExperiment.correlationMethod === CorrelationMethod.KENDALL}
                            />
                        </React.Fragment>
                    }

                    {/* Minimum correlation coefficient */}
                    <Form.Field>
                        <LabelWithInfoPopup
                            labelText={`Min. Correlation Threshold ${correlationCoefficientFormatted}`}
                            popupContent='Only those combinations that have a correlation coefficient above this threshold will be kept'
                            centered
                        />

                        <Slider
                            value={props.newExperiment.correlationCoefficient}
                            color="blue"
                            inverted={false}
                            settings={correlationSliderSettings}
                            disabled={props.isEditing}
                        />
                        <Label color="blue" pointing='above'>{MIN_VALUE_CORRELATION}</Label>
                        <Label color="blue" pointing='above' className="pull-right">1</Label>
                    </Form.Field>

                    {/* Minimum Standard Deviation for Genes */}
                    <Form.Field>
                        <LabelWithInfoPopup
                            labelText={`Genes Min. Standard Deviation ${geneStdFormatted}`}
                            popupContent='Only those genes with a standard deviation above this value will be kept'
                            centered
                        />

                        <Slider
                            value={props.newExperiment.standardDeviationGene}
                            color="blue"
                            inverted={false}
                            settings={stdGeneSliderSettings}
                            disabled={props.isEditing}
                        />
                        <Label color="blue" pointing='above'>0</Label>
                        <Label color="blue" pointing='above' className="pull-right">1</Label>
                    </Form.Field>

                    {/* Minimum Standard Deviation for GEM */}
                    <Form.Field>
                        <LabelWithInfoPopup
                            labelText={`${props.gemDescription} Min. Standard Deviation ${gemStdFormatted}`}
                            popupContent={`Only those ${props.gemDescription}s with a standard deviation above this value will be kept`}
                            centered
                        />

                        <Slider
                            value={props.newExperiment.standardDeviationGEM}
                            color="blue"
                            inverted={false}
                            settings={stdGemSliderSettings}
                            disabled={props.isEditing}
                        />
                        <Label color="blue" pointing='above'>0</Label>
                        <Label color="blue" pointing='above' className="pull-right">1</Label>
                    </Form.Field>

                    {/* P-value adjustment method */}
                    <Form.Field>
                        <LabelWithInfoPopup
                            labelText='P-value adjustment'
                            popupContent={
                                <p>P-value adjustment method for <a href='http://www.biostathandbook.com/multiplecomparisons.html' target='_blank' rel='noopener noreferrer'>Family-wise Error Rate or False Discovert Rate</a></p>
                            }
                        />

                        <Select
                            fluid
                            className="margin-top-5"
                            options={selectAdjustmentMethodsOptions}
                            name='adjustmentMethod'
                            value={props.newExperiment.adjustmentMethod}
                            onChange={(_e, { name, value }) => props.handleFormInputsChange(name, value)}
                            disabled={props.isEditing}
                        />
                    </Form.Field>
                </Form>
            }
        </React.Fragment>
    )
}
