import React from 'react'
import { Table } from 'semantic-ui-react'
import { RowHeader } from '../../../../utils/django_interfaces'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { useIntl } from 'react-intl'
import { PubmedButton } from './PubmedButton'

declare const urlMiRNATargetValidation: string

/** One experimentally validated miRNA-target record returned by Modulector. */
interface MiRNATargetValidation {
    id: number,
    mirtarbase_id: string,
    mirna: string,
    gene: string,
    target_gene_entrez_id: string | number,
    experiments: string[],
    support_type: string,
    pmid: string | number | null
}

interface MiRNATargetValidationPanelProps {
    /** Gene selected in the current experiment result row. */
    gene: string,
    /** miRNA selected in the current experiment result row. */
    miRNA: string
}

/**
 * Shows miRTarBase experimental evidence for the selected miRNA-gene pair.
 * @param props Selected miRNA and gene identifiers.
 * @returns A paginated table of validation records.
 */
export const MiRNATargetValidationPanel = (props: MiRNATargetValidationPanelProps) => {
    const intl = useIntl()
    const headers: RowHeader<MiRNATargetValidation>[] = [
        { name: intl.formatMessage({ id: 'miRNATargetValidationPanel.mirtarbaseId' }) },
        { name: intl.formatMessage({ id: 'miRNATargetValidationPanel.supportType' }) },
        { name: intl.formatMessage({ id: 'miRNATargetValidationPanel.experiments' }) },
        { name: intl.formatMessage({ id: 'miRNATargetValidationPanel.targetGeneEntrezId' }) },
        { name: intl.formatMessage({ id: 'miRNATargetValidationPanel.pubmed' }), textAlign: 'center' }
    ]

    return (
        <PaginatedTable<MiRNATargetValidation>
            headerTitle={intl.formatMessage(
                { id: 'miRNATargetValidationPanel.headerTitle' },
                { miRNA: props.miRNA, gene: props.gene }
            )}
            headers={headers}
            urlToRetrieveData={urlMiRNATargetValidation}
            queryParams={{ mirna: props.miRNA, target: props.gene }}
            defaultSortProp={{ sortField: 'gene', sortOrderAscendant: true }}
            mapFunction={(validation) => {
                const pubmedUrl = validation.pmid
                    ? `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(String(validation.pmid))}/`
                    : ''

                return (
                    <Table.Row key={validation.id}>
                        <Table.Cell>{validation.mirtarbase_id || '-'}</Table.Cell>
                        <Table.Cell>{validation.support_type || '-'}</Table.Cell>
                        <Table.Cell>{validation.experiments?.join(', ') || '-'}</Table.Cell>
                        <Table.Cell>{validation.target_gene_entrez_id || '-'}</Table.Cell>
                        <Table.Cell textAlign='center'>
                            {pubmedUrl ? <PubmedButton pubmedURL={pubmedUrl} /> : '-'}
                        </Table.Cell>
                    </Table.Row>
                )
            }}
        />
    )
}
