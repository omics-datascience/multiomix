/** Data struct retrieve from BioAPI 'information-of-genes' service. */
type GeneData = {
    alias_symbol?: string[];
    band: string;
    chromosome: string;
    end_GRCh37: number;
    end_position: number;
    ensembl_gene_id: string;
    entrez_id: string;
    gene_biotype: string;
    hgnc_id: string;
    name: string;
    omim_id: string;
    percentage_gene_gc_content: number;
    refseq_summary: string;
    start_GRCh37: number;
    start_position: number;
    strand: number;
    uniprot_ids: string;
    civic_description: string;
}

export {
    GeneData
}
