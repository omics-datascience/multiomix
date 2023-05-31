import React from 'react'
import { Input } from 'semantic-ui-react'
import { RFParameters } from '../../../../types'

/** RFPanel props. */
interface RFPanelProps {
    parameters: RFParameters,
    handleChangeRFOption: (key: string, value: number) => void,
}

/**
 * Renders a panel with all the options for the SVM fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const RFPanel = (props: RFPanelProps) => {
    const {
        parameters,
        handleChangeRFOption
    } = props

    return (
        <>
            <Input
                type='number'
                label='Number of estimators'
                name='nEstimators'
                min={10}
                max={20}
                value={parameters.nEstimators}
                onChange={(_event, data) => handleChangeRFOption(data.name, Number(data.value))}
            />

            <Input
                type='number'
                label='Maximum depth'
                name='maxDepth'
                min={3}
                value={parameters.maxDepth}
                onChange={(_event, data) => handleChangeRFOption(data.name, Number(data.value))}
            />
        </>
    )
}
