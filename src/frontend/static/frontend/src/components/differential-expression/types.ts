import { DjangoExperimentSource, DjangoUser } from '../../utils/django_interfaces'

/**
 * Possible states for experiment evaluation
 */
export enum DifferentialExpressionAnalysisExperimentState {
    /* Finished successfully */
    COMPLETED = 1,
    /* Finished with error */
    FINISHED_WITH_ERROR = 2,
    /* Currently running */
    IN_PROCESS = 3,
    /* Waiting in queue */
    WAITING_FOR_QUEUE = 4,
    /* No samples in common between clinical and mRNA data */
    NO_SAMPLES_IN_COMMON = 5,
    /* Manually stopping */
    STOPPING = 6,
    /* Automatically stopped */
    STOPPED = 7,
    /** Reached attempts limit */
    REACHED_ATTEMPTS_LIMIT = 8,
    /* No features found */
    NO_FEATURES_FOUND = 9,
    /* Empty dataset */
    EMPTY_DATASET = 10,
    /* Operation timed out */
    TIMEOUT_EXCEEDED = 11,
}

export interface DifferentialExpressionAnalysis {
    /* Unique identifier */
    id: number;
    /* Name */
    name: string;
    /* Description */
    description: string;
    /* Analysis */
    tool: string;
    /* Owner */
    user: DjangoUser;
    /* Source of clinical data */
    clinical_source: DjangoExperimentSource;
    /* Source of mRNA data */
    mrna_source: DjangoExperimentSource;
    /* Current */
    state: DifferentialExpressionAnalysisExperimentState;
    /* Human readable state */
    state_display: string;
    /* Creation date */
    created_at: string;
    /* Is public */
    is_public: boolean;
}

export interface DiffExpExperimentDetail {
    /* Unique identifier */
    id: number;
    /* Gene name */
    gene: string;
    /* Average expression */
    ave_expr: number;
    /* P-value */
    p_value: number;
    /* Adjusted p-value */
    adj_p_val: number;
    /* Log2 fold change */
    log_fc: number;
    /* T statistic */
    t_statistic: number;
    /* B statistic */
    b_statistic: number;
    /* Is significant */
    is_significant: boolean;
}

export type VolcanoPoint = {
    /* Unique identifier */
    id: string;
    /* Optional label */
    label: string;
    /* Log2 fold change */
    log2FC: number;
    /* P-value */
    pValue: number;
}
