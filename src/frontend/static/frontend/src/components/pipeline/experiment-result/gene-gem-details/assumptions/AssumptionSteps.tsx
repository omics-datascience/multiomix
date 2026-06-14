import React, { ReactElement } from 'react'
import { Icon, Step } from 'semantic-ui-react'
import { DjangoMRNAxGEMResultRow } from '../../../../../utils/django_interfaces'
import { Nullable } from '../../../../../utils/interfaces'
import { getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'
import { useIntl } from 'react-intl'

/**
 * Component's props
 */
interface AssumptionStepProps {
    title: string
    description: string,
    geneIsOk: boolean
    gemIsOk: boolean,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>
}

/**
 * Renders a general step for an Assumption considering two variables
 * @param props Component's props
 * @returns Component
 */
const AssumptionStep = (props: AssumptionStepProps) => {
    const assumptionCompleted = props.geneIsOk && props.gemIsOk
    const intl = useIntl()
    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)

    let extraDescription: string
    let icon: ReactElement

    if (assumptionCompleted) {
        // Both satisfy the condition
        icon = <Icon name='check' color='green' />
        extraDescription = ''
    } else {
        icon = <Icon name='warning sign' color='yellow' />

        if (!props.geneIsOk && !props.gemIsOk) {
            // Neither satisfies the condition
            extraDescription = intl.formatMessage({ id: 'assumptionStep.neitherSatisfies' }, { gene, gem })
        } else {
            // At least one of them satisfies the condition
            const [good, bad] = props.geneIsOk ? [gene, gem] : [gem, gene]
            extraDescription = intl.formatMessage({ id: 'assumptionStep.oneSatisfies' }, { good, bad })
        }
    }

    const stepDescription = `${props.description}. ${extraDescription}`

    return (
        <Step className='assumption-step'>
            {icon}
            <Step.Content>
                <Step.Title>{props.title}</Step.Title>
                <Step.Description>
                    {stepDescription}
                </Step.Description>
            </Step.Content>
        </Step>
    )
}

/**
 * Component's props
 */
interface AssumptionStepSimpleProps {
    title: string
    description: string,
    isOk: boolean
}

/**
 * Renders a general step for an Assumption considering only one variable
 * @param props Component's props
 * @returns Component
 */
const AssumptionStepSimple = (props: AssumptionStepSimpleProps) => {
    const intl = useIntl()
    let extraDescription: string
    let icon: ReactElement

    if (props.isOk) {
        icon = <Icon name='check' color='green' />
        extraDescription = ''
    } else {
        icon = <Icon name='times' color='red' />
        extraDescription = intl.formatMessage({ id: 'assumptionStep.notSatisfied' })
    }

    const stepDescription = `${props.description}. ${extraDescription}`

    return (
        <Step className='assumption-step'>
            {icon}
            <Step.Content>
                <Step.Title>{props.title}</Step.Title>
                <Step.Description>
                    {stepDescription}
                </Step.Description>
            </Step.Content>
        </Step>
    )
}

export { AssumptionStep, AssumptionStepSimple }
