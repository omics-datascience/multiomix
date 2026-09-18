import React, { memo } from 'react'
import { Grid, Header, Statistic } from 'semantic-ui-react'
import { DjangoBreuschPaganTest, DjangoGoldfeldQuandtTest, DjangoLinearityTest, DjangoMonotonicityTest, DjangoMRNAxGEMResultRow } from '../../../../../utils/django_interfaces'
import { Nullable } from '../../../../../utils/interfaces'
import { getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'
import { InfoPopup } from '../InfoPopup'
import { COMMON_DECIMAL_PLACES } from '../../../../../utils/constants'
import { useIntl } from 'react-intl'

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
export const GeneAndGEMSection = memo((props: GeneAndGEMSectionProps) => {
    const intl = useIntl()
    // For short...
    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)
    const bpTest = props.heteroscedasticityBreuschPagan
    const gqTest = props.homoscedasticityGoldfeldQuandt

    return (
        <Grid columns={4} divided textAlign='center'>
            {/* Number of evaluated samples */}
            <Grid.Column width={1} verticalAlign='middle'>
                <InfoPopup content={intl.formatMessage({ id: 'geneAndGEMSection.evaluatedSamplesInfo' }, { gene, gem })} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.numberOfSamplesEvaluated}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.evaluatedSamples.label' })}</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Breusch-Pagan test */}
            <Grid.Column width={6}>
                <Header as='h3' dividing>{intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.title' })}</Header>

                <InfoPopup content={intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.info' })} />

                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.lagrange_multiplier.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.lagrangeMultiplier' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.p_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.pValue' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.f_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.fValue' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{bpTest.f_p_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.breuschPagan.fPValue' })}</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Goldfeld-Quandt test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>{intl.formatMessage({ id: 'geneAndGemSection.goldfeldQuandt.title' })}</Header>

                <InfoPopup content={intl.formatMessage({ id: 'geneAndGemSection.goldfeldQuandt.info' })} />

                <Statistic size='tiny'>
                    <Statistic.Value>{gqTest.statistic.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.statistic' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{gqTest.p_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.goldfeldQuandt.pValue' })}</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Linearity test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>{intl.formatMessage({ id: 'geneAndGemSection.linearity.title' })}</Header>

                <InfoPopup content={intl.formatMessage({ id: 'geneAndGemSection.linearity.info' }, { gene, gem })} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.linearity.statistic.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.statistic' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{props.linearity.p_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.linearity.pValue' })}</Statistic.Label>
                </Statistic>
            </Grid.Column>

            {/* Monotonicity test */}
            <Grid.Column width={3}>
                <Header as='h3' dividing>{intl.formatMessage({ id: 'geneAndGemSection.monotonicity.title' })}</Header>

                <InfoPopup content={intl.formatMessage({ id: 'geneAndGemSection.monotonicity.info' }, { gene, gem })} />

                <Statistic size='tiny'>
                    <Statistic.Value>{props.monotonicity.statistic.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.statistic' })}</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{props.monotonicity.p_value.toFixed(COMMON_DECIMAL_PLACES)}</Statistic.Value>
                    <Statistic.Label>{intl.formatMessage({ id: 'geneAndGemSection.monotonicity.pValue' })}</Statistic.Label>
                </Statistic>
            </Grid.Column>
        </Grid>
    )
})
