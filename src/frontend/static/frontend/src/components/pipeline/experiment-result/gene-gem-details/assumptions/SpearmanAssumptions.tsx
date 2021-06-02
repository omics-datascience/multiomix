import React from 'react'
import { Grid, Header, Segment, Step } from 'semantic-ui-react'
import { Nullable, ReferenceCard } from '../../../../../utils/interfaces'
import { DjangoMRNAxGEMResultRow } from '..//../../../../utils/django_interfaces'
import { AssumptionsCompletion, RecommendedCorrelationMethod } from './AssumptionsPanel'
import { AssumptionStepSimple } from './AssumptionSteps'
import { ReferenceCardsGroup } from './ReferenceCardsGroup'

/**
 * Component's props
 */
interface SpearmanAssumptionsProps {
    assumptions: AssumptionsCompletion,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    recommendedMethod: RecommendedCorrelationMethod
}

export const SpearmanAssumptions = (props: SpearmanAssumptionsProps) => {
    const referenceCards: ReferenceCard[] = [
        {
            color: 'black',
            image: '/static/frontend/img/assumptions/Paper.png',
            href: 'https://www.jstor.org/stable/1412159?origin=crossref&seq=1#metadata_info_tab_contents'
        },
        {
            color: 'red',
            image: '/static/frontend/img/assumptions/Paper.png',
            href: 'https://link.springer.com/article/10.1007/BF02294183'
        },
        {
            color: 'orange',
            image: '/static/frontend/img/assumptions/DataScienceExchange.png',
            href: 'https://datascience.stackexchange.com/questions/64260/pearson-vs-spearman-vs-kendall'
        },
        {
            color: 'yellow',
            image: '/static/frontend/img/assumptions/Wikipedia.png',
            href: 'https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient'
        },
        {
            color: 'olive',
            image: '/static/frontend/img/assumptions/StatisticsSolutions.png',
            href: 'https://www.statisticssolutions.com/correlation-pearson-kendall-spearman/'
        }
    ]

    return (
        <Segment>
            <Grid>
                <Grid.Row columns={2}>
                    <Grid.Column width='6'>
                        <Header size='huge'>Spearman statistical assumptions</Header>

                        <Step.Group vertical>
                            {/* Monotonicity */}
                            <AssumptionStepSimple
                                title='Monotonicity'
                                description='Correlation should be monotonic (Spearman rank-order correlation coefficient absolute value >= 0.8 with a p-value < 0.05)'
                                isOk={props.assumptions.monotonicityIsOk}
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
