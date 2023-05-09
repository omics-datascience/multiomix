import React from 'react'
import { Card, Placeholder, SemanticWIDTHS } from 'semantic-ui-react'

/** ResultPlaceholder props. */
interface ResultPlaceholderProps {
    numberOfCards?: SemanticWIDTHS,
    fluid?: boolean,
    rectangular?: boolean
}

/**
 * Renders a Placeholder for StatisticalValidation results
 * @param props Component props.
 * @returns Component.
 */
export const ResultPlaceholder = (props: ResultPlaceholderProps) => {
    const numberOfCards = props.numberOfCards ?? 3
    const fluid = props.fluid ?? false
    const isRectangular = props.rectangular ?? false

    return (
        <Card.Group itemsPerRow={numberOfCards}>
            {Array.from(Array(numberOfCards)).map((_, idx) => (
                <Card key={idx}>
                    <Card.Content>
                        <Placeholder fluid={fluid}>
                            <Placeholder.Image square={!isRectangular} rectangular={isRectangular} />
                        </Placeholder>
                    </Card.Content>
                </Card>
            ))}
        </Card.Group>
    )
}
