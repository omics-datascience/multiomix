import React from 'react'
import { Card, Grid, Header, Segment } from 'semantic-ui-react'
import { ReferenceCard } from '../../../../../utils/interfaces'

/**
 * Component's props
 */
interface ReferenceCardsGroupProps {
    referenceCards: ReferenceCard[]
}

/**
 * Renders a Card group with assumptions references
 * @param props Component's props
 * @returns Component
 */
export const ReferenceCardsGroup = (props: ReferenceCardsGroupProps) => (
    <Grid.Row columns={1}>
        <Grid.Column>
            <Header size='huge'>References</Header>
            <Card.Group id='references-cards-group' centered itemsPerRow={9}>
                {props.referenceCards.map((referenceCard) => (
                    <Card
                        key={referenceCard.href}
                        image={referenceCard.image}
                        color={referenceCard.color}
                        link
                        onClick={() => window.open(referenceCard.href, '_blank')}
                    />
                ))}
            </Card.Group>
        </Grid.Column>
    </Grid.Row>
)
