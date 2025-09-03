import { DjangoExperimentSource, DjangoUser } from '../../utils/django_interfaces'

/**
 * Possible states for experiment evaluation
 */
export enum DifferentialExpressionAnalysisExperimentState {
    WAITING_FOR_QUEUE = 1,
    IN_PROCESS = 2,
    COMPLETED = 3,
    FINISHED_WITH_ERROR = 4,
    NO_SAMPLES_IN_COMMON = 5,
    STOPPED = 7,
    REACHED_ATTEMPTS_LIMIT = 8,
    TIMEOUT_EXCEEDED = 9,
}

export interface DifferentialExpressionAnalysis {
    id: number;
    name: string;
    description: string;
    user: DjangoUser;
    clinical_source: DjangoExperimentSource;
    mrna_source: DjangoExperimentSource;
    clinical_attribute: string;
    threshold_percentile: number;
    threshold: number;
    top: number;
    state: DifferentialExpressionAnalysisExperimentState;
    state_display: string;
    execution_time: number;
    created_at: string;
    updated_at: string;
    is_public: boolean;
    has_results: boolean;
    results_count: number;
    significant_genes_count: number;
}
