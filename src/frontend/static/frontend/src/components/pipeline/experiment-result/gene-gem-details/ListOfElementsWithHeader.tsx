import React from 'react'
import { Header, Icon, List, Segment } from 'semantic-ui-react'
import { SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic'

interface ListOfElementsWithHeaderProps {
    /** Text to show in header */
    headerTitle: string,
    /** Header icon */
    headerIcon: SemanticICONS,
    /** List of elements to render inside List component */
    children: React.ReactNode
}

/**
 * Renders a list inside a Segment with a Header with Icon
 * @param props Component's props
 * @returns Component
 */
export const ListOfElementsWithHeader = (props: ListOfElementsWithHeaderProps) => {
    return (
        <Segment>
            <Header textAlign='center'>
                <Icon name={props.headerIcon} />
                <Header.Content>{props.headerTitle}</Header.Content>
            </Header>

            <hr />

            <List relaxed>
                {props.children}
            </List>
        </Segment>
    )
}
