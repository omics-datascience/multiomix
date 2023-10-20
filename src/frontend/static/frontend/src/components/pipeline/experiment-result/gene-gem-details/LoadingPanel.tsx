import React from 'react'
import { Header, Icon } from 'semantic-ui-react'

/**
 * Renders a custom loading icon as Loader needs a Dimmer and we don't need that
 * @returns Component
 */
export const LoadingPanel = () => (
    <Header size='huge' icon textAlign='center'>
        <Icon id='loading-panel-icon' name='spinner' loading />
        Loading
    </Header>
)
