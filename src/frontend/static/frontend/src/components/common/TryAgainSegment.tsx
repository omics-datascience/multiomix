import React from 'react'
import { Button, Header, Icon, Segment } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

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
export const TryAgainSegment = (props: TryAgainSegmentProps) => {
    const intl = useIntl()

    return (
        <Segment placeholder>
            <Header icon>
                <Icon name='warning sign' />
                {intl.formatMessage({ id: 'tryAgainSegment.message' })}
            </Header>

            <Segment.Inline>
                <Button primary onClick={props.onTryAgain}>
                    {intl.formatMessage({ id: 'tryAgainSegment.button' })}
                </Button>
            </Segment.Inline>
        </Segment>
    )
}
