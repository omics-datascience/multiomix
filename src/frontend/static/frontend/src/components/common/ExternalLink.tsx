import React from 'react'

/** ExternalLink props. */
interface ExternalLinkProps {
    href: string,
    children: React.ReactNode
}

/**
 * Renders an <a> element with target='_blank' and rel='noopener noreferrer' attributes.
 * @param props Component's props.
 * @returns Component.
 */
export const ExternalLink = (props: ExternalLinkProps) => (
    <a href={props.href} target='_blank' rel='noopener noreferrer'>{props.children}</a>
)
