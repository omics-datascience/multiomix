import { GraphEdge, GraphNode } from './types'

export const MOCK_NODES: GraphNode[] = [
    { id: 'gene_braf', label: 'BRAF', type: 'Gene', size: 66 },
    { id: 'gene_mek1', label: 'MEK1', type: 'Gene', size: 46 },
    { id: 'gene_mek2', label: 'MEK2', type: 'Gene', size: 44 },
    { id: 'gene_erk1', label: 'ERK1', type: 'Gene', size: 42 },
    { id: 'gene_erk2', label: 'ERK2', type: 'Gene', size: 42 },
    { id: 'gene_myc', label: 'MYC', type: 'Gene', size: 38 },
    { id: 'gene_fos', label: 'FOS', type: 'Gene', size: 36 },
    { id: 'gene_ccnd1', label: 'CCND1', type: 'Gene', size: 36 },
    { id: 'gene_elk1', label: 'ELK1', type: 'Gene', size: 34 },
    { id: 'gene_dusp6', label: 'DUSP6', type: 'Gene', size: 34 },
    { id: 'gene_spry2', label: 'SPRY2', type: 'Gene', size: 32 },
    { id: 'gene_map3k8', label: 'MAP3K8', type: 'Gene', size: 32 },
    { id: 'mir_17', label: 'miR-17', type: 'miRNA', size: 28 },
    { id: 'mir_21', label: 'miR-21', type: 'miRNA', size: 28 },
    { id: 'cna_7q34', label: '7q34 gain', type: 'CNA', size: 34 },
    { id: 'meth_rassf1', label: 'RASSF1 meth', type: 'Methylation', size: 34 },
    { id: 'drug_vemurafenib', label: 'Vemurafenib', type: 'Drug', size: 36 },
]

export const MOCK_EDGES: GraphEdge[] = [
    { id: 'e_1', source: 'gene_braf', target: 'gene_mek1', correlation: 0.92 },
    { id: 'e_2', source: 'gene_braf', target: 'gene_mek2', correlation: 0.83 },
    { id: 'e_3', source: 'gene_braf', target: 'gene_erk1', correlation: 0.78 },
    { id: 'e_4', source: 'gene_braf', target: 'gene_dusp6', correlation: 0.72 },
    { id: 'e_5', source: 'gene_braf', target: 'gene_fos', correlation: 0.67 },

    { id: 'e_6', source: 'gene_mek1', target: 'gene_erk1', correlation: 0.88 },
    { id: 'e_7', source: 'gene_mek1', target: 'gene_erk2', correlation: 0.79 },
    { id: 'e_8', source: 'gene_mek1', target: 'gene_elk1', correlation: 0.76 },
    { id: 'e_9', source: 'gene_mek2', target: 'gene_erk2', correlation: 0.81 },

    { id: 'e_10', source: 'gene_erk1', target: 'gene_myc', correlation: 0.81 },
    { id: 'e_11', source: 'gene_erk1', target: 'gene_fos', correlation: 0.79 },
    { id: 'e_12', source: 'gene_erk2', target: 'gene_ccnd1', correlation: 0.68 },
    { id: 'e_13', source: 'gene_elk1', target: 'gene_myc', correlation: 0.61 },
    { id: 'e_14', source: 'gene_fos', target: 'gene_ccnd1', correlation: 0.58 },

    { id: 'e_15', source: 'mir_17', target: 'gene_braf', correlation: -0.66 },
    { id: 'e_16', source: 'mir_21', target: 'gene_mek1', correlation: -0.57 },
    { id: 'e_17', source: 'cna_7q34', target: 'gene_braf', correlation: 0.73 },
    { id: 'e_18', source: 'meth_rassf1', target: 'gene_braf', correlation: -0.54 },
    { id: 'e_19', source: 'drug_vemurafenib', target: 'gene_braf', correlation: -0.89 },

    { id: 'e_20', source: 'gene_map3k8', target: 'gene_mek1', correlation: 0.55 },
    { id: 'e_21', source: 'gene_braf', target: 'gene_map3k8', correlation: 0.52 },

    { id: 'e_22', source: 'gene_spry2', target: 'gene_braf', correlation: -0.32 },
    { id: 'e_23', source: 'drug_vemurafenib', target: 'gene_mek1', correlation: -0.41 },
]
