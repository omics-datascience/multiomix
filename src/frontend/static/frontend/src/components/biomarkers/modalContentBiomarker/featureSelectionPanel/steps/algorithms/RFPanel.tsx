import React from 'react'
import { Form } from 'semantic-ui-react'
import { FitnessFunctionParameters, RFParameters } from '../../../../types'

/** RFPanel props. */
interface RFPanelProps {
    parameters: RFParameters,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
}

/**
 * Renders a panel with all the options for the SVM fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const RFPanel = (props: RFPanelProps) => {
    const {
        parameters,
        handleChangeFitnessFunctionOption
    } = props

    return (
        <>
            <Form.Input
                type='number'
                label='Number of estimators'
                name='nEstimators'
                min={10}
                max={20}
                value={parameters.nEstimators}
                onChange={(_event, data) => handleChangeFitnessFunctionOption('rfParameters', data.name, Number(data.value))}
            />

            <Form.Input
                type='number'
                label='Maximum depth'
                placeholder='An integer number'
                name='maxDepth'
                min={3}
                value={parameters.maxDepth ?? ''}
                onChange={(_event, { name, value }) => handleChangeFitnessFunctionOption('rfParameters', name, Number(value))}
            />
        </>
    )
}
