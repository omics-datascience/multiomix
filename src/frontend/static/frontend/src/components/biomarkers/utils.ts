import { DropdownItemProps } from 'semantic-ui-react'
import { BiomarkerState, ClusteringAlgorithm, ClusteringMetric, ClusteringParameters, ClusteringScoringMethod, FitnessFunction, RFParameters, SVMKernel, SVMParameters, SVMTask } from './types'

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
    { key: ClusteringScoringMethod.C_INDEX, text: 'Cox-Regression', value: ClusteringScoringMethod.C_INDEX },
    { key: ClusteringScoringMethod.LOG_LIKELIHOOD, text: 'Log-Rank test', value: ClusteringScoringMethod.LOG_LIKELIHOOD }
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
        scoringMethod: ClusteringScoringMethod.C_INDEX,
        metric: ClusteringMetric.COX_REGRESSION,
        nClusters: 2,
        randomState: null,
        lookForOptimalNClusters: true
    }
}

/**
 * Generates default clustering parameters.
 * @returns Default Cluster structure
 */
const getDefaultRFParameters = (): RFParameters => {
    return {
        nEstimators: 100,
        maxDepth: 10,
        randomState: null
    }
}

export {
    fitnessFunctionsOptions,
    SVMKernelOptions,
    clusteringAlgorithmOptions,
    clusteringMetricOptions,
    clusteringScoringMethodOptions,
    biomarkerStateOptions,
    getDefaultSvmParameters,
    getDefaultClusteringParameters,
    getDefaultRFParameters
}
