import { DjangoExperimentSource, DjangoUser } from '../../utils/django_interfaces'

/**
 * Possible states for experiment evaluation
 */
export enum DifferentialExpressionAnalysisExperimentState {
    COMPLETED = 1,
    FINISHED_WITH_ERROR = 2,
    IN_PROCESS = 3,
    WAITING_FOR_QUEUE = 4,
    NO_SAMPLES_IN_COMMON = 5,
    STOPPING = 6,
    STOPPED = 7,
    REACHED_ATTEMPTS_LIMIT = 8,
    NO_FEATURES_FOUND = 9,
    EMPTY_DATASET = 10,
    TIMEOUT_EXCEEDED = 11,
}

export interface DifferentialExpressionAnalysis {
    id: number;
    name: string;
    description: string;
    user: DjangoUser;
    clinical_source: DjangoExperimentSource;
    mrna_source: DjangoExperimentSource;
    state: DifferentialExpressionAnalysisExperimentState;
    state_display: string;
    created_at: string;
    is_public: boolean;
}

export interface DiffExpExperimentDetail {
    id: number;
    gene: string;
    ave_expr: number;
    p_value: number;
    adj_p_val: number;
    log_fc: number;
    t_statistic: number;
    b_statistic: number;
    is_significant: boolean;
}
