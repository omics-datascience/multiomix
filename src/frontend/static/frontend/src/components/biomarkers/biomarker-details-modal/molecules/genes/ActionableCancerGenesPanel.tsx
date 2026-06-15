import React from 'react'
import { useIntl } from 'react-intl'

export const ActionableCancerGenesPanel = () => {
    const intl = useIntl()

    return (
        <div>{intl.formatMessage({ id: 'actionableCancerGenes.panel.title' })}</div>
    )
}
