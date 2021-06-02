import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

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
export const PubmedButton = (props: PubmedButtonProps) => (
    <Button
        basic
        color="blue"
        icon
        title='See in NCBI'
        className="borderless-button"
        disabled={!props.pubmedURL}
        as='a' href={props.pubmedURL} target="_blank" rel='noopener noreferrer'
    >
        <Icon name='file' />
    </Button>
)
