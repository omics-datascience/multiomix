import React from 'react'
import { Card, Grid, Header, Image } from 'semantic-ui-react'
import { BiomarkerOrigin } from '../../types'
import { useIntl } from 'react-intl'

/** BiomarkerTypeSelection props. */
interface BiomarkerTypeSelectionProps {
    handleSelectModal: (type: BiomarkerOrigin) => void,
}

export const BiomarkerTypeSelection = (props: BiomarkerTypeSelectionProps) => {
    const intl = useIntl()
    const cards = [
        {
            title: intl.formatMessage({ id: 'biomarkerType.empty.title' }),
            description: intl.formatMessage({ id: 'biomarkerType.empty.description' }),
            action: () => props.handleSelectModal(BiomarkerOrigin.MANUAL),
            image: '/static/frontend/img/biomarkers/Empty.png'
        },
        {
            title: intl.formatMessage({ id: 'biomarkerType.featureSelection.title' }),
            description: intl.formatMessage({ id: 'biomarkerType.featureSelection.description' }),
            action: () => props.handleSelectModal(BiomarkerOrigin.FEATURE_SELECTION),
            image: '/static/frontend/img/biomarkers/Fs3.png'
        }
    ]
    return (
        <>
            <Header as='h2' textAlign='center'>
                {intl.formatMessage({ id: 'biomarkerType.createNew' })}

            </Header>

            <Grid stackable>
                <Grid.Row columns={3} className='grid--container'>
                    <Grid.Column width={16}>
                        <h2 className='text--subtitle'>{intl.formatMessage({ id: 'biomarkerType.chooseType' })}</h2>
                    </Grid.Column>
                    {
                        cards.map(card => (
                            <Grid.Column key={card.title}>
                                <Card
                                    onClick={card.action}
                                    centered
                                    className='card--container'
                                >
                                    <Card.Content className='card--content'>
                                        <Image src={card.image} alt={card.title} size='small' className='margin-bottom-5' />

                                        <Card.Header textAlign='center'>
                                            {card.title}
                                        </Card.Header>
                                        <Card.Description textAlign='center'>
                                            {card.description}
                                        </Card.Description>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>
                        ))
                    }
                </Grid.Row>
            </Grid>
        </>
    )
}
