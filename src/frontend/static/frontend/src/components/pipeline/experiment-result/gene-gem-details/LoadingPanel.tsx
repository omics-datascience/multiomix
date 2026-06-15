import React from 'react'
import { Header, Icon } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

/**
 * Renders a custom loading icon as Loader needs a Dimmer and we don't need that
 * @returns Component
 */
export const LoadingPanel = () => {
    const intl = useIntl()

    return (
        <Header size='huge' icon textAlign='center'>
            <Icon id='loading-panel-icon' name='spinner' loading />
            {intl.formatMessage({ id: 'loadingPanel.loading' })}
        </Header>
    )
}
