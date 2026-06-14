import React from 'react'
import { Grid, Header, Segment, Step } from 'semantic-ui-react'
import { Nullable, ReferenceCard } from '../../../../../utils/interfaces'
import { DjangoMRNAxGEMResultRow } from '..//../../../../utils/django_interfaces'
import { AssumptionsCompletion, RecommendedCorrelationMethod } from './AssumptionsPanel'
import { AssumptionStep, AssumptionStepSimple } from './AssumptionSteps'
import { ReferenceCardsGroup } from './ReferenceCardsGroup'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
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
                        <Header size='huge'>{intl.formatMessage({ id: 'pearsonAssumptions.title' })}</Header>

                        <Step.Group vertical>
                            {/* Normality */}
                            <AssumptionStep
                                title={intl.formatMessage({ id: 'pearsonAssumptions.normality.title' })}
                                description={intl.formatMessage(
                                    {
                                        id: 'pearsonAssumptions.normality.description'
                                    },
                                    {
                                        gene: props.gene,
                                        gem: props.gem
                                    }
                                )}
                                geneIsOk={props.assumptions.geneNormalityIsOk}
                                gemIsOk={props.assumptions.gemNormalityIsOk}
                                selectedRow={props.selectedRow}
                            />

                            {/* Outliers */}
                            <AssumptionStep
                                title={intl.formatMessage({ id: 'pearsonAssumptions.outliers.title' })}
                                description={intl.formatMessage({ id: 'pearsonAssumptions.outliers.description' })}
                                geneIsOk={props.assumptions.geneOutliersIsOk}
                                gemIsOk={props.assumptions.gemOutliersIsOk}
                                selectedRow={props.selectedRow}
                            />

                            {/* Linearity */}
                            <AssumptionStepSimple
                                title={intl.formatMessage({
                                    id: 'pearsonAssumptions.linearity.title'
                                })}
                                description={intl.formatMessage({ id: 'pearsonAssumptions.linearity.description' })}
                                isOk={props.assumptions.linearityIsOk}
                            />

                            {/* Homoscedasticity */}
                            <AssumptionStepSimple
                                title={intl.formatMessage({ id: 'pearsonAssumptions.homoscedasticity.title' })}
                                description={intl.formatMessage({ id: 'pearsonAssumptions.homoscedasticity.description' })}
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
