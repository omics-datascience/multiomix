import React from 'react'
import { Header, Statistic } from 'semantic-ui-react'
import { LogRankStatistic, Nullable } from '../../../../../utils/interfaces'

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
    const [statistic, pValue] = props.logrankTest === null
        ? ['-', '-']
        : [props.logrankTest.test_statistic.toFixed(3), props.logrankTest.p_value.toExponential(3)]

    return (
        <React.Fragment>
            <Header as='h2' dividing>Logrank test</Header>

            <Statistic size='tiny'>
                <Statistic.Value>{statistic}</Statistic.Value>
                <Statistic.Label>Statistic</Statistic.Label>
            </Statistic>
            <Statistic size='tiny'>
                <Statistic.Value>{pValue}</Statistic.Value>
                <Statistic.Label>P-Value</Statistic.Label>
            </Statistic>
        </React.Fragment>
    )
}
