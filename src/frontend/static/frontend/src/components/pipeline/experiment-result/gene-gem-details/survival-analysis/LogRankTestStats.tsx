import React from 'react'
import { Header, Statistic } from 'semantic-ui-react'
import { LogRankStatistic, Nullable } from '../../../../../utils/interfaces'
import { useIntl } from 'react-intl'

/**
 * Component's props
 */
interface LogRankTestStatsProps {
    /** LogRank statistic and p-value */
    logrankTest: Nullable<LogRankStatistic>
}

/**
 * Renders a Logrank test statistic and p-value
 * @param props Component's props
 * @returns Component
 */
export const LogRankTestStats = (props: LogRankTestStatsProps) => {
    const intl = useIntl()
    const [statistic, pValue] = props.logrankTest === null
        ? ['-', '-']
        : [props.logrankTest.test_statistic.toFixed(3), props.logrankTest.p_value.toExponential(3)]

    return (
        <>
            <Header as='h2' dividing>{intl.formatMessage({ id: 'logRankTestStats.header' })}</Header>

            <Statistic size='tiny'>
                <Statistic.Value>{statistic}</Statistic.Value>
                <Statistic.Label>{intl.formatMessage({ id: 'logRankTestStats.statistic' })}</Statistic.Label>
            </Statistic>
            <Statistic size='tiny'>
                <Statistic.Value>{pValue}</Statistic.Value>
                <Statistic.Label>{intl.formatMessage({ id: 'logRankTestStats.pValue' })}</Statistic.Label>
            </Statistic>
        </>
    )
}
