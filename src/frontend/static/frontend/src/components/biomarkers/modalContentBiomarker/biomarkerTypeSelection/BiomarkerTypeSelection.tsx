import React from 'react'
import { Card, Grid, Header, Image } from 'semantic-ui-react'
import { BiomarkerTypeSelected } from '../../types'
import './biomarkerTypeSelectionStyles.css'

interface BiomarkerTypeSelectionProps {
    handleSelectModal: (type: BiomarkerTypeSelected) => void,
}

export const BiomarkerTypeSelection = (props: BiomarkerTypeSelectionProps) => {
    const cards = [
        {
            title: 'Emtpy',
            description: 'Create an empty Biomarker. You can later add molecules or features (genes, microRNAs, DNA methylation, CNAs) that will make up the biomarker',
            action: () => props.handleSelectModal(BiomarkerTypeSelected.MANUAL),
            image: '/static/frontend/img/biomarkers/Empty.png'
        },
        {
            title: 'Feature Selection/ML',
            description: 'As a starting point, you can select a previously discovered Biomarker, a well-known Biomarker, or a superset of genes that you would like to test. This method will select the molecular subset that fits the better prediction',
            action: () => props.handleSelectModal(BiomarkerTypeSelected.FEATURE_SELECTION),
            image: '/static/frontend/img/biomarkers/Fs3.png'
        }
    ]
    return (
        <>
            <Header as="h2" textAlign="center">
                Create a new Biomarker
            </Header>

            <Grid stackable >
                <Grid.Row columns={3} className='grid--container'>
                    <Grid.Column width={16}>
                        <h2 className='text--subtitle'>Choose type of Biomarker</h2>
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
