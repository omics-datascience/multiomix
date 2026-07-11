import React from 'react'
import { Label } from 'semantic-ui-react'
import { DjangoTissue } from '../../utils/django_interfaces'

type TissueValue = DjangoTissue | number

interface TissueLabelsProps {
    tissues?: TissueValue | TissueValue[] | null,
    tissueOptions: DjangoTissue[]
}

export const normalizeTissues = (tissues: TissueLabelsProps['tissues']): TissueValue[] => {
    if (!tissues) {
        return []
    }

    return Array.isArray(tissues) ? tissues : [tissues]
}

const getTissue = (tissueValue: TissueValue, tissueOptions: DjangoTissue[]): DjangoTissue | undefined => {
    if (typeof tissueValue === 'number') {
        return tissueOptions.find((tissue) => tissue.id === tissueValue)
    }

    return tissueValue
}

export const getTissueIds = (tissues: TissueLabelsProps['tissues']): number[] =>
    normalizeTissues(tissues).map((tissue) => typeof tissue === 'number' ? tissue : tissue.id)

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
