import { DropdownItemProps } from 'semantic-ui-react'
import { BBHAVersion, Biomarker, BiomarkerState, ClusteringAlgorithm, ClusteringMetric, ClusteringParameters, ClusteringScoringMethod, FitnessFunction, RFParameters, SVMKernel, SVMParameters, SVMTask } from './types'
import { Nullable } from '../../utils/interfaces'

/** Available options for BBHA versions */
const advanceBBHAOptions: DropdownItemProps[] = [
    { key: BBHAVersion.ORIGINAL, text: 'Original', value: BBHAVersion.ORIGINAL },
    { key: BBHAVersion.IMPROVED, text: 'Version 2', value: BBHAVersion.IMPROVED }
]

const improvedBBHACoeff1Options: DropdownItemProps[] = [
    { key: '2.2', text: 2.2, value: 2.2 },
    { key: '2.35', text: 2.35, value: 2.35 }
]

const improvedBBHACoeff2Options: DropdownItemProps[] = [
    { key: '0.1', text: 0.1, value: 0.1 },
    { key: '0.2', text: 0.2, value: 0.2 },
    { key: '0.3', text: 0.3, value: 0.3 }
]

/** Available fitness functions models to use. */
const fitnessFunctionsOptions: DropdownItemProps[] = [
    { key: FitnessFunction.CLUSTERING, text: 'Clustering', value: FitnessFunction.CLUSTERING },
    { key: FitnessFunction.SVM, text: 'SVM', value: FitnessFunction.SVM },
    { key: FitnessFunction.RF, text: 'Random Forest', value: FitnessFunction.RF }
]

/** Available options for a SVM kernel. */
const SVMKernelOptions: DropdownItemProps[] = [
    { key: SVMKernel.LINEAR, text: 'Linear', value: SVMKernel.LINEAR },
    { key: SVMKernel.POLYNOMIAL, text: 'Polynomial', value: SVMKernel.POLYNOMIAL },
    { key: SVMKernel.RBF, text: 'RBF', value: SVMKernel.RBF }
]

/** Available options for a Clustering algorithm. */
const clusteringAlgorithmOptions: DropdownItemProps[] = [
    { key: ClusteringAlgorithm.K_MEANS, text: 'K-Means', value: ClusteringAlgorithm.K_MEANS },
    { key: ClusteringAlgorithm.SPECTRAL, text: 'Spectral', value: ClusteringAlgorithm.SPECTRAL }
]

/** Available options for a Clustering metric to optimize. */
const clusteringMetricOptions: DropdownItemProps[] = [
    { key: ClusteringMetric.COX_REGRESSION, text: 'Cox-Regression', value: ClusteringMetric.COX_REGRESSION },
    { key: ClusteringMetric.LOG_RANK_TEST, text: 'Log-Rank test', value: ClusteringMetric.LOG_RANK_TEST, disabled: true } // TODO: implement in backend
]

/** Available options for a Clustering scoring method for Cox-Regression. */
const clusteringScoringMethodOptions: DropdownItemProps[] = [
    { key: ClusteringScoringMethod.C_INDEX, text: 'C-Index', value: ClusteringScoringMethod.C_INDEX },
    { key: ClusteringScoringMethod.LOG_LIKELIHOOD, text: 'Log likelihood', value: ClusteringScoringMethod.LOG_LIKELIHOOD }
]

/** Available options for a Biomarker's state. */
const biomarkerStateOptions: DropdownItemProps[] = [
    { key: BiomarkerState.COMPLETED, text: 'Completed', value: BiomarkerState.COMPLETED },
    { key: BiomarkerState.FINISHED_WITH_ERROR, text: 'Finished with error', value: BiomarkerState.FINISHED_WITH_ERROR },
    { key: BiomarkerState.WAITING_FOR_QUEUE, text: 'Waiting for queue', value: BiomarkerState.WAITING_FOR_QUEUE },
    { key: BiomarkerState.NO_SAMPLES_IN_COMMON, text: 'No samples in common', value: BiomarkerState.NO_SAMPLES_IN_COMMON },
    { key: BiomarkerState.IN_PROCESS, text: 'In process', value: BiomarkerState.IN_PROCESS },
    { key: BiomarkerState.STOPPING, text: 'Stopping', value: BiomarkerState.STOPPING },
    { key: BiomarkerState.STOPPED, text: 'Stopped', value: BiomarkerState.STOPPED },
    { key: BiomarkerState.REACHED_ATTEMPTS_LIMIT, text: 'Reached attempts limit', value: BiomarkerState.REACHED_ATTEMPTS_LIMIT },
    { key: BiomarkerState.NO_FEATURES_FOUND, text: 'No features found', value: BiomarkerState.NO_FEATURES_FOUND }
]

/**
 * Generates default SVM parameters.
 * @returns Default SVM structure
 */
const getDefaultSvmParameters = (): SVMParameters => {
    return {
        task: SVMTask.REGRESSION,
        maxIterations: 1000,
        kernel: SVMKernel.LINEAR,
        randomState: null
    }
}

/**
 * Generates default clustering parameters.
 * @returns Default Cluster structure
 */
const getDefaultClusteringParameters = (): ClusteringParameters => {
    return {
        algorithm: ClusteringAlgorithm.K_MEANS,
        scoringMethod: ClusteringScoringMethod.LOG_LIKELIHOOD,
        metric: ClusteringMetric.COX_REGRESSION,
        nClusters: 2,
        randomState: null,
        penalizer: 0.0,
        lookForOptimalNClusters: true
    }
}

/**
 * Generates default clustering parameters.
 * @returns Default Cluster structure
 */
const getDefaultRFParameters = (): RFParameters => {
    return {
        nEstimators: 10,
        maxDepth: null,
        randomState: null,
        lookForOptimalNEstimators: true
    }
}

/**
 * Returns the number of molecules of a biomarker.
 * @param biomarker Biomarker to get the number of molecules from.
 * @returns Number of molecules of the biomarker.
 */
const getNumberOfMoleculesOfBiomarker = (biomarker: Nullable<Biomarker>): number => {
    const mrnas = biomarker?.number_of_mrnas ?? 0
    const mirnas = biomarker?.number_of_mirnas ?? 0
    const cnas = biomarker?.number_of_cnas ?? 0
    const methylations = biomarker?.number_of_methylations ?? 0
    return mrnas + mirnas + cnas + methylations
}

export {
    advanceBBHAOptions,
    improvedBBHACoeff1Options,
    improvedBBHACoeff2Options,
    fitnessFunctionsOptions,
    SVMKernelOptions,
    clusteringAlgorithmOptions,
    clusteringMetricOptions,
    clusteringScoringMethodOptions,
    biomarkerStateOptions,
    getDefaultSvmParameters,
    getDefaultClusteringParameters,
    getDefaultRFParameters,
    getNumberOfMoleculesOfBiomarker
}
