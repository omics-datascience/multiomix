import React, { useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { ResultPlaceholder } from '../../stat-validations/result/ResultPlaceholder'
import { Nullable } from '../../../../../utils/interfaces'
import { GeneData } from './types'
import { Accordion, Button, Card, Grid, Icon, Message, Segment } from 'semantic-ui-react'

declare const urlGeneInformation: string

/** GeneInformation props. */
interface GeneInformationProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

/**
 * Renders a panel with general information of a molecule
 * @param props Component props.
 * @returns Component.
 */
export const GeneInformation = (props: GeneInformationProps) => {
    const abortController = useRef(new AbortController())
    const [geneData, setGeneData] = useState<Nullable<GeneData>>(null)
    const [loadingData, setLoadingData] = useState(false)
    const [linksData, setLinksData] = useState<{
        source: string;
        url: string;
        rel: string;
        icon?: string;
    }[]>([])
    const [activeIndex, setActiveIndex] = useState(0)

    /** Every time the selected molecule changes, retrieves its data from the backend. */
    useEffect(() => {
        getMoleculeData(props.selectedMolecule)

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedMolecule.id])

    const handleClickAccordion = (i: number) => {
        setActiveIndex(i)
    }

    const handleButtonNavigate = (url: string) => {
        window.open(url, '_blank')
    }

    const getMoleculeData = (selectedMolecule: BiomarkerMolecule) => {
        setLoadingData(true)

        const searchParams = { gene: selectedMolecule.identifier }
        ky.get(urlGeneInformation, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { data: GeneData }) => {
                const moleculeKey = Object.keys(jsonResponse.data)[0]
                const linksData = [
                    {
                        source: 'PubMed',
                        rel: 'PubMed',
                        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${moleculeKey}+`,
                        icon: 'https://www.gene-list.com/build/images/pubmed.svg'
                    },
                    {
                        source: 'Google',
                        rel: 'Google',
                        url: `https://scholar.google.ca/scholar?hl=en&as_sdt=0%2C5&q=${moleculeKey}+`,
                        icon: 'https://www.gene-list.com/build/images/google.svg'
                    },
                    {
                        source: 'GeneCards',
                        rel: 'GeneCards',
                        url: `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/gene_cards.svg'
                    },
                    {
                        source: 'MalaCards',
                        rel: 'MalaCards',
                        url: `https://www.malacards.org/search/results?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/malacards.svg'
                    },
                    {
                        source: 'PathCards',
                        rel: 'PathCards',
                        url: `https://pathcards.genecards.org/Search/Results?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/pathcards.svg'
                    },
                    {
                        source: 'Reactome',
                        rel: 'Reactome',
                        url: `https://reactome.org/content/query?q=${moleculeKey}&species=Homo+sapiens&species=Entries+without+species&cluster=true`,
                        icon: 'https://www.gene-list.com/build/images/reactome.svg'
                    },
                    {
                        source: 'GeneMANIA',
                        rel: 'GeneMANIA',
                        url: `https://genemania.org/search/homo-sapiens/${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/genemania.svg'
                    },
                    {
                        source: 'Pathway Commons',
                        rel: 'Pathway Commons',
                        url: `https://apps.pathwaycommons.org/search?type=Pathway&q=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/pathway_commons.svg'
                    },
                    {
                        source: 'STRING',
                        rel: 'STRING',
                        url: `https://string-db.org/newstring_cgi/show_network_section.pl?identifiers=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/string.svg'
                    },
                    {
                        source: 'IntAct',
                        rel: 'IntAct',
                        url: `https://www.ebi.ac.uk/intact/search?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/intact.svg'
                    },
                    {
                        source: 'Interactome Atlas',
                        rel: 'Interactome Atlas',
                        url: `http://www.interactome-atlas.org/search/${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/interactomeatlas.svg'
                    },
                    {
                        source: 'Complex Portal',
                        rel: 'Complex Portal',
                        url: `https://www.ebi.ac.uk/complexportal/complex/search?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/complex_portal.svg'
                    },
                    {
                        source: 'BioGrid',
                        rel: 'BioGrid',
                        url: `https://thebiogrid.org//summary/homo-sapiens/${moleculeKey}.html`,
                        icon: 'https://www.gene-list.com/build/images/biogrid.svg'
                    },
                    {
                        source: 'DGV',
                        rel: 'DGV',
                        url: `http://dgv.tcag.ca/gb2/gbrowse/dgv2_hg19/?name=${moleculeKey};search=Search`,
                        icon: 'https://www.gene-list.com/build/images/dgv.svg'
                    },
                    {
                        source: 'ClinVar',
                        rel: 'ClinVar',
                        url: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${moleculeKey}%5Bgene%5D&redir=gene`,
                        icon: 'https://www.gene-list.com/build/images/ncbi.svg'
                    },
                    {
                        source: 'DGIDB',
                        rel: 'DGIDB',
                        url: `https://www.dgidb.org/genes/${moleculeKey}#_interactions`,
                        icon: 'https://www.gene-list.com/build/images/dgibd.svg'
                    },
                    {
                        source: 'NCBI',
                        rel: 'NCBI',
                        url: `https://www.ncbi.nlm.nih.gov/gene/${jsonResponse.data[moleculeKey].entrez_id}`,
                        icon: 'https://www.gene-list.com/build/images/ncbi.svg'
                    },
                    {
                        source: 'Ensembl',
                        rel: 'Ensembl',
                        url: `http://www.ensembl.org/id/${jsonResponse.data[moleculeKey].ensembl_gene_id}`,
                        icon: 'https://www.gene-list.com/build/images/ensembl.svg'
                    },
                    {
                        source: 'UCSC Browser',
                        rel: 'UCSC Browser',
                        url: `http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&singleSearch=knownCanonical&position=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/ucsc.svg'
                    },
                    {
                        source: 'Uniprot',
                        rel: 'Uniprot',
                        url: `http://www.uniprot.org/uniprot/${jsonResponse.data[moleculeKey].uniprot_ids}`,
                        icon: 'https://www.gene-list.com/build/images/uniprot.svg'
                    },
                    {
                        source: 'Human Protein Atlas',
                        rel: 'Human Protein Atlas',
                        url: `https://www.proteinatlas.org/${jsonResponse.data[moleculeKey].uniprot_ids}`,
                        icon: 'https://www.gene-list.com/build/images/hpa.svg'
                    },
                    {
                        source: 'Alliance Genome',
                        rel: 'Alliance Genome',
                        url: `https://www.proteinatlas.org/${jsonResponse.data[moleculeKey].hgnc_id}`,
                        icon: 'https://www.gene-list.com/build/images/alliance_genome_human.svg'
                    },
                    {
                        source: 'HGNC',
                        rel: 'HGNC',
                        url: `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${jsonResponse.data[moleculeKey].hgnc_id}`,
                        icon: 'https://www.gene-list.com/build/images/hgnc.svg'
                    },
                    {
                        source: 'Monarch',
                        rel: 'Monarch',
                        url: `https://monarchinitiative.org/gene/${jsonResponse.data[moleculeKey].hgnc_id}`,
                        icon: 'https://www.gene-list.com/build/images/monarch.svg'
                    },
                    {
                        source: 'HI-C Browser',
                        rel: 'HI-C Browser',
                        url: `http://3dgenome.fsm.northwestern.edu/view.php?method=Hi-C&species=human&assembly=hg38&source=inside&tissue=GM12878&type=Rao_2014-raw&c_url=&transfer=&gene=${jsonResponse.data[moleculeKey].uniprot_ids}&sessionID=&browser=none`,
                        icon: 'https://www.gene-list.com/build/images/hi_c_browser.svg'
                    },
                    {
                        source: 'InterPro',
                        rel: 'InterPro',
                        url: `https://www.ebi.ac.uk/interpro/protein/UniProt/${jsonResponse.data[moleculeKey].hgnc_id}`,
                        icon: 'https://www.gene-list.com/build/images/interpro.svg'
                    },
                    {
                        source: 'PDB',
                        rel: 'PDB',
                        url: `https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22group%22%2C%22logical_operator%22%3A%22and%22%2C%22nodes%22%3A%5B%7B%22type%22%3A%22group%22%2C%22logical_operator%22%3A%22and%22%2C%22nodes%22%3A%5B%7B%22type%22%3A%22group%22%2C%22nodes%22%3A%5B%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22full_text%22%2C%22parameters%22%3A%7B%22value%22%3A%22${moleculeKey}%22%7D%7D%5D%2C%22logical_operator%22%3A%22and%22%7D%5D%2C%22label%22%3A%22full_text%22%7D%5D%7D%2C%22return_type%22%3A%22entry%22%2C%22request_options%22%3A%7B%22pager%22%3A%7B%22start%22%3A0%2C%22rows%22%3A25%7D%2C%22scoring_strategy%22%3A%22combined%22%2C%22sort%22%3A%5B%7B%22sort_by%22%3A%22score%22%2C%22direction%22%3A%22desc%22%7D%5D%7D%2C%22request_info%22%3A%7B%22query_id%22%3A%225a4bea3ded0ab9c9fd19c0405097e1b2%22%7D%7D`,
                        icon: 'https://www.gene-list.com/build/images/pdb.svg'
                    },
                    {
                        source: 'AlphaFold',
                        rel: 'AlphaFold',
                        url: `https://alphafold.ebi.ac.uk/entry/${jsonResponse.data[moleculeKey].uniprot_ids}`,
                        icon: 'https://www.gene-list.com/build/images/alphafold.svg'
                    },
                    {
                        source: 'Amigo',
                        rel: 'Amigo',
                        url: `http://amigo.geneontology.org/amigo/gene_product/UniProtKB:${jsonResponse.data[moleculeKey].uniprot_ids}`,
                        icon: 'https://www.gene-list.com/build/images/amigo.svg'
                    },
                    {
                        source: 'BioPlex',
                        rel: 'BioPlex',
                        url: `https://bioplex.hms.harvard.edu/explorer/externalQuery.php?geneQuery=${jsonResponse.data[moleculeKey].entrez_id}`,
                        icon: 'https://www.gene-list.com/build/images/bioplex.svg'
                    },
                    {
                        source: 'GTEX',
                        rel: 'GTEX',
                        url: `https://www.gtexportal.org/home/gene/${jsonResponse.data[moleculeKey].ensembl_gene_id}`,
                        icon: 'https://www.gene-list.com/build/images/gtex.svg'
                    },
                    {
                        source: 'GDC',
                        rel: 'GDC',
                        url: `https://portal.gdc.cancer.gov/genes/${jsonResponse.data[moleculeKey].ensembl_gene_id}`,
                        icon: 'https://www.gene-list.com/build/images/tcga.svg'
                    },
                    {
                        source: 'ICGC',
                        rel: 'ICGC',
                        url: `https://dcc.icgc.org/genes/${jsonResponse.data[moleculeKey].ensembl_gene_id}`,
                        icon: 'https://www.gene-list.com/build/images/pcawg.svg'
                    },
                    {
                        source: 'cBioPortal',
                        rel: 'cBioPortal',
                        url: `http://www.cbioportal.org/results/cancerTypesSummary?cancer_study_list=laml_tcga_pan_can_atlas_2018%2Cacc_tcga_pan_can_atlas_2018%2Cblca_tcga_pan_can_atlas_2018%2Clgg_tcga_pan_can_atlas_2018%2Cbrca_tcga_pan_can_atlas_2018%2Ccesc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018%2Ccoadread_tcga_pan_can_atlas_2018%2Cdlbc_tcga_pan_can_atlas_2018%2Cesca_tcga_pan_can_atlas_2018%2Cgbm_tcga_pan_can_atlas_2018%2Chnsc_tcga_pan_can_atlas_2018%2Ckich_tcga_pan_can_atlas_2018%2Ckirc_tcga_pan_can_atlas_2018%2Ckirp_tcga_pan_can_atlas_2018%2Clihc_tcga_pan_can_atlas_2018%2Cluad_tcga_pan_can_atlas_2018%2Clusc_tcga_pan_can_atlas_2018%2Cmeso_tcga_pan_can_atlas_2018%2Cov_tcga_pan_can_atlas_2018%2Cpaad_tcga_pan_can_atlas_2018%2Cpcpg_tcga_pan_can_atlas_2018%2Cprad_tcga_pan_can_atlas_2018%2Csarc_tcga_pan_can_atlas_2018%2Cskcm_tcga_pan_can_atlas_2018%2Cstad_tcga_pan_can_atlas_2018%2Ctgct_tcga_pan_can_atlas_2018%2Cthym_tcga_pan_can_atlas_2018%2Cthca_tcga_pan_can_atlas_2018%2Cucs_tcga_pan_can_atlas_2018%2Cucec_tcga_pan_can_atlas_2018%2Cuvm_tcga_pan_can_atlas_2018&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=all&gene_list=${moleculeKey}&geneset_list=%20&tab_index=tab_visualize&Action=Submit`,
                        icon: 'https://www.gene-list.com/build/images/cbioportal.svg'
                    },
                    {
                        source: 'OMIM',
                        rel: 'OMIM',
                        url: `https://omim.org/entry/616125${jsonResponse.data[moleculeKey].omim_id}`,
                        icon: 'https://www.gene-list.com/build/images/omim.svg'
                    },
                    {
                        source: 'HPO',
                        rel: 'HPO',
                        url: `https://hpo.jax.org/app/browse/gene/${jsonResponse.data[moleculeKey].entrez_id}`,
                        icon: 'https://www.gene-list.com/build/images/hpo.svg'
                    },
                    {
                        source: 'Open Targets',
                        rel: 'Open Targets',
                        url: `https://genetics.opentargets.org/gene/ENSG00000164169${jsonResponse.data[moleculeKey].ensembl_gene_id}`,
                        icon: 'https://www.gene-list.com/build/images/open_targets.svg'
                    },
                    {
                        source: 'Expression Atlas',
                        rel: 'Expression Atlas',
                        url: `https://www.ebac.uk/gxa/search?geneQuery=%5B%7B%22value%22%3A%22PRMT9%22%7D%5D&species=&conditionQuery=%5B%5D&bs=%7B%22homo%20sapiens%22%3A%5B%22ORGANISM_PART%22%5D%2C%22chlorocebus%20sabaeus%22%3A%5B%22ORGANISM_PART%22%5D%2C%22danio%20rerio%22%3A%5B%22DEVELOPMENTAL_STAGE%22%5D%2C%22equus%20caballus%22%3A%5B%22ORGANISM_PART%22%5D%2C%22gallus%20gallus%22%3A%5B%22ORGANISM_PART%22%5D%2C%22mus%20musculus%22%3A%5B%22ORGANISM_PART%22%5D%2C%22papio%20anubis%22%3A%5B%22ORGANISM_PART%22%5D%2C%22rattus%20norvegicus%22%3A%5B%22ORGANISM_PART%22%5D%7D&ds=%7B%22kingdom%22%3A%5B%22animals%22%5D%7D#baseline${jsonResponse.data[moleculeKey].entrez_id}`,
                        icon: 'https://www.gene-list.com/build/images/expression_atlas.svg'
                    },
                    {
                        source: 'GWAS Catalog',
                        rel: 'GWAS Catalog',
                        url: `https://www.ebi.ac.uk/gwas/search?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/gwas.svg'
                    },
                    {
                        source: 'ActiveDriverDb',
                        rel: 'ActiveDriverDb',
                        url: `https://activedriverdb.org/gene/show/${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/activedriverdb.svg'
                    },
                    {
                        source: 'Pharmgkb',
                        rel: 'Pharmgkb',
                        url: `https://www.pharmgkb.org/search?query=${moleculeKey}`,
                        icon: 'https://www.gene-list.com/build/images/pharmgkb.svg'
                    }
                ]
                setLinksData(linksData)
                setGeneData(jsonResponse.data)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting gene information', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoadingData(false)
            }
        })
    }

    if (loadingData) {
        return <ResultPlaceholder numberOfCards={1} fluid rectangular />
    }

    if (!geneData) {
        return null
    }

    return (
        <>
            <Grid>
                {/* Basic data */}
                <Grid.Row columns={2} divided stretched>
                    <Grid.Column width={4}>
                        <Card
                            header={geneData.name}
                            meta={geneData.alias_symbol}
                            description={geneData.ensembl_gene_id}
                            extra={
                                <Grid textAlign='center'>
                                    <Grid.Row columns={2} divided>
                                        <Grid.Column><strong>Start</strong>: {geneData.start_position}</Grid.Column>
                                        <Grid.Column><strong>End</strong>: {geneData.end_position}</Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            }
                            color='violet'
                        />
                    </Grid.Column>
                    <Grid.Column width={12}>
                        <Message
                            header='Summary'
                            content={geneData.refseq_summary}
                        />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={2} divided stretched>
                    <Grid.Column width={4}>

                    </Grid.Column>
                    <Grid.Column width={12}>

                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Segment style={{
                margin: '2rem 6rem'
            }}
            >
                <Accordion style={{
                    padding: 0
                }}
                >
                    <Accordion.Title
                        active={activeIndex === 1}
                        icon={<></>}
                        content={
                            <Grid padded columns={6} stackable>
                                {linksData.slice(0, 5).map(item => (
                                    <Grid.Column key={item.source}>
                                        <Button
                                            fluid
                                            icon
                                            color='blue'
                                            onClick={() => handleButtonNavigate(item.url)}
                                            style={{
                                                justifyContent: 'center',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title={item.source}
                                        >
                                            <img src={item.icon} alt={item.rel} width={16} height={16} style={{ marginRight: '4px' }} />
                                            <p className='ellipsis'> {item.source}</p>
                                        </Button>
                                    </Grid.Column>
                                ))}
                                <Grid.Column
                                    style={{
                                        justifyContent: 'center',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Button icon onClick={() => handleClickAccordion(activeIndex === 1 ? 0 : 1)}>
                                        <Icon name='dropdown' />
                                    </Button>
                                </Grid.Column>
                            </Grid>
                        }
                        index={1}
                    />
                    <Accordion.Content active={activeIndex === 1} content={
                        <Grid columns={6} stackable>
                            {linksData.slice(5, linksData.length).map(item => (
                                <Grid.Column key={item.source}>
                                    <Button
                                        fluid
                                        icon
                                        color='blue'
                                        onClick={() => handleButtonNavigate(item.url)}
                                        style={{
                                            justifyContent: 'center',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title={item.source}
                                    >
                                        <img src={item.icon} alt={item.rel} width={16} height={16} style={{ marginRight: '4px' }} />
                                        <p className='ellipsis'> {item.source}</p>
                                    </Button>
                                </Grid.Column>
                            ))}
                        </Grid>
                    }
                    />
                </Accordion>
            </Segment>
        </>
    )
}
