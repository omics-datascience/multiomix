import React from 'react'
import { Button, Header, Icon, Segment } from 'semantic-ui-react'

/** Component's props. */
interface TryAgainSegmentProps {
    /** Callback to retry the action. */
    onTryAgain: () => void
}

/**
 * Renders a segment with a message to try again.
 * @param props Component's props.
 * @returns Component.
 */
export const TryAgainSegment = (props: TryAgainSegmentProps) => (
    <Segment placeholder>
        <Header icon>
            <Icon name='warning sign' />
            Something went wrong, please try again
        </Header>

        <Segment.Inline>
            <Button primary onClick={props.onTryAgain}>
                Try Again
            </Button>
        </Segment.Inline>
    </Segment>
)
