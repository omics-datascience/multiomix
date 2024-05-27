import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { SVMKernel } from '../types'

/** SVMKernelLabel props. */
interface SVMKernelLabelProps {
    /** SVMKernel value. */
    kernel: SVMKernel,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the SVMKernel enum.
 * @param props Component props.
 * @returns Component.
 */
export const SVMKernelLabel = (props: SVMKernelLabelProps) => {
    let color: SemanticCOLORS
    let description: string

    switch (props.kernel) {
        case SVMKernel.LINEAR:
            color = 'green'
            description = 'Linear'
            break
        case SVMKernel.POLYNOMIAL:
            color = 'blue'
            description = 'Polynomial'
            break
        case SVMKernel.RBF:
            color = 'olive'
            description = 'RBF'
            break
        default:
            color = 'blue'
            description = ''
            break
    }

    return (
        <Label color={color} className={`align-center ${props.className ?? ''}`}>
            {description}
        </Label>
    )
}
