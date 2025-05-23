import React from 'react'
import { Grid, Header, Segment, Step } from 'semantic-ui-react'
import { Nullable, ReferenceCard } from '../../../../../utils/interfaces'
import { DjangoMRNAxGEMResultRow } from '..//../../../../utils/django_interfaces'
import { AssumptionsCompletion, RecommendedCorrelationMethod } from './AssumptionsPanel'
import { AssumptionStep, AssumptionStepSimple } from './AssumptionSteps'
import { ReferenceCardsGroup } from './ReferenceCardsGroup'

/**
 * Component's props
 */
interface PearsonAssumptionsProps {
    assumptions: AssumptionsCompletion,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    recommendedMethod: RecommendedCorrelationMethod,
    gene: string,
    gem: string
}

export const PearsonAssumptions = (props: PearsonAssumptionsProps) => {
    const referenceCards: ReferenceCard[] = [
        {
            color: 'red',
            image: '/static/frontend/img/assumptions/Paper.png',
            href: 'https://zenodo.org/record/1431587'
        },
        {
            color: 'orange',
            image: '/static/frontend/img/assumptions/DataScienceExchange.png',
            href: 'https://datascience.stackexchange.com/questions/64260/pearson-vs-spearman-vs-kendall'
        },
        {
            color: 'yellow',
            image: '/static/frontend/img/assumptions/Wikipedia.png',
            href: 'https://en.wikipedia.org/wiki/Pearson_correlation_coefficient#Using_the_Fisher_transformation'
        },
        {
            color: 'olive',
            image: '/static/frontend/img/assumptions/StatisticsSolutions.png',
            href: 'https://www.statisticssolutions.com/correlation-pearson-kendall-spearman/'
        },
        {
            color: 'green',
            image: '/static/frontend/img/assumptions/GenericReference.png',
            href: 'http://www.biostathandbook.com/linearregression.html'
        }
    ]

    return (
        <Segment>
            <Grid>
                <Grid.Row columns={2}>
                    <Grid.Column width='6'>
                        <Header size='huge'>Pearson statistical assumptions</Header>

                        <Step.Group vertical>
                            {/* Normality */}
                            <AssumptionStep
                                title='Normality'
                                description={`Gene (${props.gene}) expression values and GEM (${props.gem}) expression values should be normally distributed each other for applying Pearson`}
                                geneIsOk={props.assumptions.geneNormalityIsOk}
                                gemIsOk={props.assumptions.gemNormalityIsOk}
                                selectedRow={props.selectedRow}
                            />

                            {/* Outliers */}
                            <AssumptionStep
                                title='Outliers'
                                description='There should be no outliers'
                                geneIsOk={props.assumptions.geneOutliersIsOk}
                                gemIsOk={props.assumptions.gemOutliersIsOk}
                                selectedRow={props.selectedRow}
                            />

                            {/* Linearity */}
                            <AssumptionStepSimple
                                title='Linearity'
                                description='Correlation should be lineal'
                                isOk={props.assumptions.linearityIsOk}
                            />

                            {/* Homoscedasticity */}
                            <AssumptionStepSimple
                                title='Homoscedasticity'
                                description='Correlation should be homoscedastic'
                                isOk={props.assumptions.homoscedasticityIsOk}
                            />
                        </Step.Group>
                    </Grid.Column>

                    {/* Rating */}
                    <Grid.Column width='10'>
                        <ReferenceCardsGroup referenceCards={referenceCards} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Segment>
    )
}
