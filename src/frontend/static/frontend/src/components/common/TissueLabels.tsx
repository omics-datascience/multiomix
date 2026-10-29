import React from 'react'
import { Label } from 'semantic-ui-react'
import { DjangoTissue } from '../../utils/django_interfaces'

interface TissueLabelsProps {
    tissues?: DjangoTissue | DjangoTissue[] | null,
    tissueOptions: DjangoTissue[]
}

/**
 * Normalizes a tissue value into an array so callers can pass either one tissue, multiple tissues, or no value.
 * @param tissues Tissue value or values to normalize.
 * @returns Tissue values as an array.
 */
export const normalizeTissues = (tissues: TissueLabelsProps['tissues']): DjangoTissue[] => {
    if (!tissues) {
        return []
    }

    return Array.isArray(tissues) ? tissues : [tissues]
}

/**
 * Extracts tissue ids from tissue objects.
 * @param tissues Tissue value or values.
 * @returns Tissue ids.
 */
export const getTissueIds = (tissues: TissueLabelsProps['tissues']): number[] =>
    normalizeTissues(tissues).map((tissue) => tissue.id)

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
