import React, { useEffect, useRef, useState } from 'react'
import { Divider, Grid, Header, Icon, Placeholder, PlaceholderLine, PlaceholderParagraph, Segment, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'semantic-ui-react'
import ky from 'ky'
import { DjangoMethylationDataJSON } from '../../../../../utils/django_interfaces'
import { Nullable, KySearchParams } from '../../../../../utils/interfaces'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ExternalLink } from '../../../../common/ExternalLink'

declare const urlMethylationData: string

/**
 * Component's props
 */
interface MethylationInformationProps {
    /** Methylation identifier to send to the backend. */
    selectedMethylation: string,
    /** If `true` shows a Header with a message indicating no data. Default `true`. */
    showNoDataHeader?: boolean
}

/**
 * Renders a panel with general information of a methylation site. It's a wrapper for the MethylationExtraData component
 * (useful to center in the middle of the screen).
 * @param props Component props.
 * @returns Component.
 */
export const MethylationInformation = (props: MethylationInformationProps) => {
    const [methylationData, setMethylationData] = useState<Nullable<DjangoMethylationDataJSON>>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const abortController = useRef(new AbortController())
    const showNoDataHeader = props.showNoDataHeader ?? true

    /**
     * Function to get Methylation data
     */
    const getMethylationData = () => {
        setLoading(true)

        const searchParams: KySearchParams = {
            methylation_site: props.selectedMethylation
        }

        ky.get(urlMethylationData, { signal: abortController.current.signal, searchParams }).then((response) => {
            response.json().then((jsonResponse: DjangoMethylationDataJSON) => {
                setMethylationData(jsonResponse)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting studies ->', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    /** Effect to get methylation data when component is mount. */
    useEffect(() => {
        getMethylationData()

        return () => {
            abortController.current.abort()
        }
    }, [])

    if (!methylationData) {
        if (!showNoDataHeader) {
            return null
        }

        return !loading
            ? (
                <Grid className='margin-top-2'>
                    <Grid.Row stretched>
                        <Grid.Column width={16} textAlign='center'>
                            <Header size='huge' icon>
                                <Icon name='folder outline' />

                                No details found for this methylation site
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
            : (
                // Shows a Placeholder while loading
                <Placeholder fluid>
                    <PlaceholderParagraph>
                        <PlaceholderLine />
                        <PlaceholderLine />
                        <PlaceholderLine />
                        <PlaceholderLine />
                    </PlaceholderParagraph>
                </Placeholder>
            )
    }

    const methylationAliases = [methylationData.name, ...methylationData.aliases].join(' / ')

    return (
        <Grid className='min-height-50vh' stretched>
            <Grid.Row>
                <Grid.Column textAlign='center' width={8}>
                    <Segment>
                        <InfoPopup
                            content='Methylation aliases and chromosome position'
                            onTop
                            onEvent='hover'
                        />
                        <Header size='huge' textAlign='left' className='margin-top-0'>
                            Methylation Information
                        </Header>

                        <Divider />

                        <Header size='large'>
                            <span>{methylationAliases}</span>
                        </Header>

                        {methylationData.chromosome_position &&
                            <Header size='large'>
                                Chr. Position: {methylationData.chromosome_position}
                            </Header>}
                    </Segment>

                    <Segment>
                        <InfoPopup
                            content={
                                <span>
                                    List of islands related to the methylation site according to the <ExternalLink href='https://genome.ucsc.edu/cgi-bin/hgTrackUi?hgsid=2155344452_RupMtKk6A9IgaOvoZvt1JA970CO7&g=cpgIsland&hgTracksConfigPage=configure'>UCSC database</ExternalLink>
                                </span>
                            }
                            onTop
                        />
                        <Header size='huge' textAlign='left' className='margin-top-0'>
                            UCSC CpG Islands
                        </Header>

                        <Table celled>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>CpG Island</TableHeaderCell>
                                    <TableHeaderCell>Relation</TableHeaderCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {methylationData.ucsc_cpg_islands.map((cpgIsland) => (
                                    <TableRow key={cpgIsland.cpg_island}>
                                        <TableCell>{cpgIsland.cpg_island}</TableCell>
                                        <TableCell>{cpgIsland.relation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Segment>
                </Grid.Column>

                <Grid.Column width={8}>
                    <Segment>
                        <InfoPopup
                            content={<span>Genes related to this methylation site and the regions where the methylation site is located. These regions, according to the NCBI RefSeq database, can be: <i>5UTR=5'</i> untranslated region between the Transcription Start Site (TTS) and ATG start site, <i>3UTR=3'</i> untranslated region between the stop codon and poly A signal, exon_#, TSS200=1-200 bp 5' the TSS, or TS1500=200-1500 bp 5' of the TSS</span>}
                            onTop
                            onEvent='hover'
                        />
                        <Header size='huge' textAlign='left' className='margin-top-0'>
                            Related genes
                        </Header>

                        <Table celled>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Gene</TableHeaderCell>
                                    <TableHeaderCell>Regions</TableHeaderCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {Object.entries(methylationData.genes).map(([gene, regions]) => (
                                    <TableRow key={gene}>
                                        <TableCell>{gene}</TableCell>
                                        <TableCell>{regions.join(' / ')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
