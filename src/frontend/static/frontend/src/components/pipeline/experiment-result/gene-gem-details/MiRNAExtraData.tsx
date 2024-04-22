import React, { useEffect, useRef, useState } from 'react'
import { Button, Grid, Header, Icon } from 'semantic-ui-react'
import { DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import { KySearchParams, Nullable } from '../../../../utils/interfaces'
import { ExternalLink } from '../../../common/ExternalLink'
import ky from 'ky'
import './../../../../css/base.css'

declare const urlMiRNAData: string

/** LinkOrPlainText props. */
interface LinkOrPlainTextProps {
    /** Url for the ExternalLink, if `undefined` shows an `span` element. */
    url?: string,
    /** Text of the ExternalLink/span. */
    text: string
}

/**
 * Renders a Link to another source if URL is valid. Otherwise, it returns a simple span
 * @param props Component's props
 * @returns Component
 */
const LinkOrPlainText = (props: LinkOrPlainTextProps) => {
    if (props.url) {
        return <ExternalLink href={props.url}>{props.text}</ExternalLink>
    }

    return <span>{props.text}</span>
}

/**
 * Component's props
 */
interface MiRNAExtraDataProps {
    /** miRNA identifier to send to the backend. */
    miRNA: string,
}

/**
 * Renders a grid with miRNA extra data
 * @param props Component's props
 * @returns Component
 */
export const MiRNAExtraData = (props: MiRNAExtraDataProps) => {
    const [miRNAData, setMiRNAData] = useState<Nullable<DjangoMiRNADataJSON>>(null)
    const abortController = useRef(new AbortController())

    /**
     * Function to get MiRNA data
     */
    const getMiRNAData = () => {
        if (!miRNAData) {
            const searchParams: KySearchParams = {
                mirna: props.miRNA
            }

            ky.get(urlMiRNAData, { signal: abortController.current.signal, searchParams }).then((response) => {
                response.json().then((jsonResponse: DjangoMiRNADataJSON) => {
                    setMiRNAData(jsonResponse)
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error getting studies ->', err)
            })
        }
    }

    /**
     * effect to get MirNA data when component is mount
     */
    useEffect(() => {
        getMiRNAData()

        return () => {
            abortController.current.abort()
        }
    }, [])

    if (!miRNAData) {
        return null
    }

    const mirbaseURL = miRNAData.links.find((link) => link.source === 'mirbase')?.url
    const othersLinks = miRNAData.links.filter((link) => link.source !== 'mirbase')

    // Sorts descendant to put MIMAT format first
    const miRNAAliases = miRNAData.aliases.sort((a, b) => b.localeCompare(a)).join(' / ')

    return (
        <Grid className='margin-bottom-2' centered>
            <Grid.Row divided centered>
                <Grid.Column width={othersLinks.length ? 6 : 8} title='miRNA aliases' textAlign='center' verticalAlign='middle'>
                    <Header size='large'>
                        <LinkOrPlainText url={mirbaseURL} text={miRNAAliases} />
                    </Header>
                </Grid.Column>

                {miRNAData.mirna_sequence &&
                    <Grid.Column width={8} title='Sequence' verticalAlign='middle'>
                        <Header size='large'>
                            {miRNAData.mirna_sequence}
                        </Header>
                    </Grid.Column>
                }

                {(othersLinks.length > 0) &&
                    <Grid.Column width={2} verticalAlign='middle'>
                        {othersLinks.map((link) => (
                            <Button
                                key={link.source}
                                basic
                                color="blue"
                                icon
                                title={link.source}
                                className="borderless-button no-box-shadow"
                                as='a' href={link.url} target="_blank" rel='noopener noreferrer'
                            >
                                <Icon name='linkify' />
                            </Button>
                        ))}
                    </Grid.Column>
                }
            </Grid.Row>
        </Grid>
    )
}
