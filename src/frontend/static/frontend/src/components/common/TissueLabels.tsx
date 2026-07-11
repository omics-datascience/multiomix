import React from 'react'
import { Label } from 'semantic-ui-react'
import { DjangoTissue } from '../../utils/django_interfaces'

type TissueValue = DjangoTissue | number

interface TissueLabelsProps {
    tissues?: TissueValue | TissueValue[] | null,
    tissueOptions: DjangoTissue[]
}

/**
 * Normalizes a tissue value into an array so callers can pass either one tissue, a tissue id, or no value.
 * @param tissues Tissue value or values to normalize.
 * @returns Tissue values as an array.
 */
export const normalizeTissues = (tissues: TissueLabelsProps['tissues']): TissueValue[] => {
    if (!tissues) {
        return []
    }

    return Array.isArray(tissues) ? tissues : [tissues]
}

/**
 * Resolves a tissue object from a tissue object or id.
 * @param tissueValue Tissue object or id.
 * @param tissueOptions Available tissue options.
 * @returns The resolved tissue if it exists.
 */
const getTissue = (tissueValue: TissueValue, tissueOptions: DjangoTissue[]): DjangoTissue | undefined => {
    if (typeof tissueValue === 'number') {
        return tissueOptions.find((tissue) => tissue.id === tissueValue)
    }

    return tissueValue
}

/**
 * Extracts tissue ids from a tissue value.
 * @param tissues Tissue value or values.
 * @returns Tissue ids.
 */
export const getTissueIds = (tissues: TissueLabelsProps['tissues']): number[] =>
    normalizeTissues(tissues).map((tissue) => typeof tissue === 'number' ? tissue : tissue.id)

/**
 * Builds dropdown options from tissue objects.
 * @param tissues Available tissue objects.
 * @param includeNoTissueOption If true, prepends an option that clears the selected tissue.
 * @returns Dropdown options for Semantic UI.
 */
export const getTissueDropdownOptions = (
    tissues: DjangoTissue[],
    includeNoTissueOption: boolean = false
) => {
    const tissueOptions = tissues.map((tissue) => ({
        key: tissue.id,
        value: tissue.id,
        text: tissue.name
    }))

    return includeNoTissueOption
        ? [{ key: 'no_tissue', value: '', text: 'No tissue' }, ...tissueOptions]
        : tissueOptions
}

/**
 * Renders tissue labels using the available tissue option metadata.
 * @param props Component props.
 * @returns Tissue labels or a dash when no tissue exists.
 */
export const TissueLabels = (props: TissueLabelsProps) => {
    const tissues = normalizeTissues(props.tissues)
        .map((tissueValue) => getTissue(tissueValue, props.tissueOptions))
        .filter((tissue): tissue is DjangoTissue => tissue !== undefined)

    if (tissues.length === 0) {
        return <>-</>
    }

    return (
        <Label.Group size='tiny'>
            {tissues.map((tissue) => (
                <Label key={tissue.id} title={tissue.code}>
                    {tissue.name}
                </Label>
            ))}
        </Label.Group>
    )
}
