import { DjangoSurvivalColumnsTupleSimple } from '../../utils/django_interfaces'

/**
 * Checks if a survival tuple (time, event) is valid for submission
 * @param survivalTuple Survival tuple to check
 * @returns True if tuple is valid, false otherwise
 */
const survivalTupleIsValid = (survivalTuple: DjangoSurvivalColumnsTupleSimple): boolean => {
    return survivalTuple.time_column.trim().length > 0 &&
        survivalTuple.event_column.trim().length > 0
}

export { survivalTupleIsValid }
