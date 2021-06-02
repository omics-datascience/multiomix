import React from 'react'
import { Grid, Header, Statistic } from 'semantic-ui-react'
import { DjangoBreuschPaganTest, DjangoGoldfeldQuandtTest, DjangoLinearityTest, DjangoMonotonicityTest, DjangoMRNAxGEMResultRow } from '../../../../../utils/django_interfaces'
import { Nullable } from '../../../../../utils/interfaces'
import { getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'
import { InfoPopup } from '../InfoPopup'

/**
 * Component's props
 */
interface GeneAndGEMSectionProps {
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    numberOfSamplesEvaluated: number,
    heteroscedasticityBreuschPagan: DjangoBreuschPaganTest,
    homoscedasticityGoldfeldQuandt: DjangoGoldfeldQuandtTest
    linearity: DjangoLinearityTest
    monotonicity: DjangoMonotonicityTest
}

/**
 * Renders in common info between Gene and GEM data
 * @param props Component's props
 * @returns Component
 */
export const GeneAndGEMSection = (props: GeneAndGEMSectionProps) => {
    // For short...
    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)
    const bpTest = props.heteroscedasticityBreuschPagan
    const gqTest = props.homoscedasticityGoldfeldQuandt

    return (
        <Grid columns={4} divided textAlign='center'>
            {/* Number of evaluated samples */}
            <Grid.Column width={1} verticalAlign='middle'>
                <InfoPopup content={`Number of samples in common between ${gene} and ${gem}`} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.numberOfSamplesEvaluated}</Statistic.Value>
                    <Statistic.Label>Evaluated samples</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Breusch-Pagan test */}
            <Grid.Column width={6}>
                <Header as='h3' dividing>Breusch-Pagan test</Header>

                <InfoPopup content=' It evaluates if the random disturbance is different across points in the correlation graph. Thus heteroscedasticity is the absence of homoscedasticity'/>

                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.lagrange_multiplier}</Statistic.Value>
                    <Statistic.Label>Lagrange Mult.</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.p_value}</Statistic.Value>
                    <Statistic.Label>P-Value</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.f_value}</Statistic.Value>
                    <Statistic.Label>F Value</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.f_p_value}</Statistic.Value>
                    <Statistic.Label>F P-Value</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Goldfeld-Quandt test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>Goldfeld-Quandt test</Header>

                <InfoPopup content='It tests the homoscedasticity of the correlation. Homoscedasticity essentially means that the relationship between the two variables we are correlating stays the same at all points, with the scores evenly spread along and around the regression line' />

                <Statistic size='tiny'>
                    <Statistic.Value>{gqTest.statistic}</Statistic.Value>
                    <Statistic.Label>Statistic</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{gqTest.p_value}</Statistic.Value>
                    <Statistic.Label>P-Value</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Linearity test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>Linearity test</Header>

                <InfoPopup content={`A relationship (correlation in this case) is linear if one variable (${gene}) increases by approximately the same rate as the other variables ${gem} changes by one unit`} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.linearity.statistic}</Statistic.Value>
                    <Statistic.Label>Statistic</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{props.linearity.p_value}</Statistic.Value>
                    <Statistic.Label>P-Value</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Monotonicity test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>Monotonicity (Spearman Rank)</Header>

                <InfoPopup content={`It evaluates if ${gene} expressión presents a monotonic relationship with ${gem} values. They are monotonic if when ${gene} increases ${gem} increases or when ${gene} decreases ${gem} decreases`} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.monotonicity.statistic}</Statistic.Value>
                    <Statistic.Label>Statistic</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{props.monotonicity.p_value}</Statistic.Value>
                    <Statistic.Label>P-Value</Statistic.Label>
                </Statistic>
            </Grid.Column>
        </Grid>
    )
}
