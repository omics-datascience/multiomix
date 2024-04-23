import React from 'react'
import { ExternalLink } from './ExternalLink'

/** LinkOrPlainText props. */
interface LinkOrPlainTextProps {
    /** Url for the ExternalLink, if `undefined` shows an `span` element. */
    url?: string,
    /** Text of the ExternalLink/span. */
    text: string
}

/**
 * Renders a Link to another source if URL is valid. Otherwise, it returns a simple span
 * @param props Component's props
 * @returns Component
 */
export const LinkOrPlainText = (props: LinkOrPlainTextProps) => {
    if (props.url) {
        return <ExternalLink href={props.url}>{props.text}</ExternalLink>
    }

    return <span>{props.text}</span>
}
