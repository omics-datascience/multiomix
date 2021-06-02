import React from 'react'
import { CorrelationMethod, DjangoMonotonicityTest, DjangoMRNAxGEMResultRow, DjangoNormalityTest, DjangoSourceDataOutliersBasic, SourceDataStatisticalPropertiesResponse, DjangoExperiment } from '../../../../../utils/django_interfaces'
import { PearsonAssumptions } from './PearsonAssumptions'
import { SpearmanAssumptions } from './SpearmanAssumptions'
import { KendallAssumptions } from './KendallAssumptions'
import { Nullable } from '../../../../../utils/interfaces'
import { getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'

const ALPHA_LEVEL: number = 0.05

/**
 * Structure needed to check assumptions
 */
interface AssumptionsCompletion {
    geneNormalityIsOk: boolean,
    gemNormalityIsOk: boolean,
    geneOutliersIsOk: boolean,
    gemOutliersIsOk: boolean,
    linearityIsOk: boolean,
    homoscedasticityIsOk: boolean,
    monotonicityIsOk: boolean,
}

/** Type of recommended correlation method */
type RecommendedCorrelationMethod = 'Pearson' | 'Spearman/Kendall' | null

/**
 * Component's props
 */
interface AssumptionsPanelProps {
    statisticalProperties: Nullable<SourceDataStatisticalPropertiesResponse>,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    experiment: DjangoExperiment
}

/**
 * Renders the assumptions panel
 * @param props Component's props
 * @returns Component
 */
const AssumptionsPanel = (props: AssumptionsPanelProps) => {
    if (!props.statisticalProperties) {
        return null
    }

    /**
     * Checks if it's considered normal
     * @param normalityTest Normality test object to check
     * @returns True if normal, false otherwise
     */
    function isNormal (normalityTest: DjangoNormalityTest): boolean { return normalityTest.p_value >= ALPHA_LEVEL }

    /**
     * Checks if it's considered monotonic
     * @param monotonicityTest Monotonicity test object to check
     * @returns True if monotonic, false otherwise
     */
    function isMonotonic (monotonicityTest: DjangoMonotonicityTest): boolean {
        return Math.abs(monotonicityTest.statistic) >= 0.8 && monotonicityTest.p_value < ALPHA_LEVEL
    }

    /**
     * Checks if there is no outlier
     * @param outliers Outliers array
     * @returns True if there is an absence of outliers, false otherwise
     */
    function noOutliers (outliers: DjangoSourceDataOutliersBasic[]): boolean { return outliers.length === 0 }

    /**
     * Checks if there's a better correlation method for the user data
     * @param assumptions Assumptions to analyse
     * @returns Recommended method or null if no applies
     */
    function getRecommendation (assumptions: AssumptionsCompletion): RecommendedCorrelationMethod {
        const corMethod = props.experiment.correlation_method
        const goodForPearson = assumptions.geneNormalityIsOk &&
            assumptions.linearityIsOk &&
            assumptions.homoscedasticityIsOk &&
            assumptions.geneOutliersIsOk &&
            assumptions.gemOutliersIsOk

        let recommendation: Nullable<RecommendedCorrelationMethod> = null

        if (corMethod !== CorrelationMethod.PEARSON && goodForPearson) {
            recommendation = 'Pearson'
        } else {
            // Spearman and Kendall have the same assumptions
            if (
                corMethod === CorrelationMethod.PEARSON &&
                !goodForPearson &&
                assumptions.monotonicityIsOk
            ) {
                recommendation = 'Spearman/Kendall'
            }
        }

        return recommendation
    }

    // For short...
    const stats = props.statisticalProperties

    const assumptions: AssumptionsCompletion = {
        geneNormalityIsOk: isNormal(stats.gene_normality),
        gemNormalityIsOk: isNormal(stats.gem_normality),
        geneOutliersIsOk: noOutliers(stats.gene_outliers),
        gemOutliersIsOk: noOutliers(stats.gem_outliers),
        monotonicityIsOk: isMonotonic(stats.monotonicity),
        linearityIsOk: stats.linearity.p_value >= ALPHA_LEVEL,
        homoscedasticityIsOk: stats.homoscedasticity_goldfeld_quandt.p_value >= ALPHA_LEVEL
    }

    const recommendedMethod = getRecommendation(assumptions)

    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)

    switch (props.experiment.correlation_method) {
        case CorrelationMethod.PEARSON:
            return (
                <PearsonAssumptions
                    selectedRow={props.selectedRow}
                    assumptions={assumptions}
                    recommendedMethod={recommendedMethod}
                    gene={gene}
                    gem={gem}
                />
            )
        case CorrelationMethod.SPEARMAN:
            return (
                <SpearmanAssumptions
                    selectedRow={props.selectedRow}
                    assumptions={assumptions}
                    recommendedMethod={recommendedMethod}
                />
            )
        case CorrelationMethod.KENDALL:
            return (
                <KendallAssumptions
                    selectedRow={props.selectedRow}
                    assumptions={assumptions}
                    recommendedMethod={recommendedMethod}
                />
            )
        default:
            return null
    }
}

export { AssumptionsCompletion, AssumptionsPanel, RecommendedCorrelationMethod }
