import React from 'react'
import { Card, Grid, Header } from 'semantic-ui-react'
import { BiomarkerTypeSelected } from '../../types'
import './BiomarkerTypeSelectionStyles.css'

interface BiomarkerTypeSelectionProps {
    handleSelectModal: (type: BiomarkerTypeSelected) => void,

}
export const BiomarkerTypeSelection = (props: BiomarkerTypeSelectionProps) => {
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
                    <Grid.Column>
                        <Card
                            onClick={() => props.handleSelectModal(BiomarkerTypeSelected.MANUAL)}
                            centered
                        >
                            <Card.Content>
                                <Card.Header textAlign='center'>
                                    Manually
                                </Card.Header>
                                <Card.Description textAlign='center'>
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda ex libero facilis quia eos incidunt, asperiores voluptate perferendis eveniet dolore ipsum corrupti eius quos dolores debitis officiis aspernatur quod sunt!
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </Grid.Column>
                    <Grid.Column>
                        <Card
                            onClick={() => props.handleSelectModal(BiomarkerTypeSelected.FEATURE_SELECTION)}
                            centered
                        >
                            <Card.Content>
                                <Card.Header textAlign='center'>
                                    Using Feature Selection optimization
                                </Card.Header>
                                <Card.Description textAlign='center'>
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda ex libero facilis quia eos incidunt, asperiores voluptate perferendis eveniet dolore ipsum corrupti eius quos dolores debitis officiis aspernatur quod sunt!
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </Grid.Column>
                    <Grid.Column>
                        <Card
                            centered
                        >
                            <Card.Content>
                                <Card.Header textAlign='center'>
                                    remplazar
                                </Card.Header>
                                <Card.Description textAlign='center'>
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda ex libero facilis quia eos incidunt, asperiores voluptate perferendis eveniet dolore ipsum corrupti eius quos dolores debitis officiis aspernatur quod sunt!
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </Grid.Column>
                </Grid.Row>
            </Grid>

        </>
    )
}
