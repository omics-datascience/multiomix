import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

/**
 * Component's props
 */
interface PubmedButtonProps {
    pubmedURL: string
}

/**
 * Renders a button which opens NCBI data for a specific Pubmed URL
 * @param props Component's props
 * @returns Component
 */
export const PubmedButton = (props: PubmedButtonProps) => {
    const intl = useIntl()

    return (
        <Button
            basic
            color='blue'
            icon
            title={intl.formatMessage({ id: 'pubmedButton.seeInNCBI' })}
            className='borderless-button'
            disabled={!props.pubmedURL}
            as='a'
            href={props.pubmedURL}
            target='_blank'
            rel='noopener noreferrer'
        >
            <Icon name='file' />
        </Button>
    )
}
