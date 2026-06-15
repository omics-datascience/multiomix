import React from 'react'
import { Segment, Header } from 'semantic-ui-react'

/**
 * Props for the FAQQuestionAndAnswer component.
 */
interface FAQQuestionAndAnswerProps {
    /** The unique identifier for the segment */
    segmentId: string;
    /** The title of the FAQ question */
    headerTitle: string;
    /** The answer content for the FAQ question */
    answer: React.ReactNode;
}

/**
 * Reusable component for displaying a FAQ question and its answer.
 *  @param props - Object containing  `segmentId`,  `headerTitle`, and  `answer`
 *  @returns A React component that displays a FAQ question and its answer.
 */
export const FAQQuestionAndAnswer = (props: FAQQuestionAndAnswerProps) => {
    const { segmentId, headerTitle, answer } = props
    return (
        <Segment id={segmentId} basic>
            <Header as='h2'>{headerTitle}</Header>
            {answer}
        </Segment>
    )
}
