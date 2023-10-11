import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { SVMTask } from '../types'

/** SVMKernelTask props. */
interface SVMKernelTaskProps {
    /** SVMKernel value. */
    task: SVMTask,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the SVMTask enum.
 * @param props Component props.
 * @returns Component.
 */
export const SVMKernelTask = (props: SVMKernelTaskProps) => {
    let color: SemanticCOLORS
    let description: string

    switch (props.task) {
        case SVMTask.REGRESSION:
            color = 'green'
            description = 'Regression'
            break
        case SVMTask.RANKING:
            color = 'blue'
            description = 'Ranking'
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
