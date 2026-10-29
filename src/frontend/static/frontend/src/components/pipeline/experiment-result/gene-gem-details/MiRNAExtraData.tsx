import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { Button, Grid, Header, Icon, Placeholder, PlaceholderLine, PlaceholderParagraph } from 'semantic-ui-react'
import { DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import { KySearchParams, Nullable } from '../../../../utils/interfaces'
import { LinkOrPlainText } from '../../../common/LinkOrPlainText'
import { useIntl } from 'react-intl'

declare const urlMiRNAData: string

/**
 * Component's props
 */
interface MiRNAExtraDataProps {
    /** miRNA identifier to send to the backend. */
    miRNA: string,
    /** Additional className for the component. */
    className?: string
    /** If `true` shows a Header with a message indicating no data. Default `true`. */
    showNoDataHeader?: boolean
}

/**
 * Renders a grid with miRNA extra data
 * @param props Component's props
 * @returns Component
 */
export const MiRNAExtraData = (props: MiRNAExtraDataProps) => {
    const intl = useIntl()
    const [miRNAData, setMiRNAData] = useState<Nullable<DjangoMiRNADataJSON>>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const showNoDataHeader = props.showNoDataHeader ?? true

    /** Gets miRNA data whenever the selected molecule changes. */
    useEffect(() => {
        const abortController = new AbortController()
        setLoading(true)
        setMiRNAData(null)

        const searchParams: KySearchParams = {
            mirna: props.miRNA
        }

        ky.get(urlMiRNAData, { signal: abortController.signal, searchParams }).json<DjangoMiRNADataJSON>().then((jsonResponse) => {
            setMiRNAData(jsonResponse)
        }).catch((err) => {
            if (!abortController.signal.aborted) {
                console.log('Error getting miRNA data ->', err)
            }
        }).finally(() => {
            if (!abortController.signal.aborted) {
                setLoading(false)
            }
        })

        return () => abortController.abort()
    }, [props.miRNA])

    if (!miRNAData) {
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

                                {intl.formatMessage({ id: 'miRNAExtraData.noDetails' })}
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

    const mirbaseURL = miRNAData.links.find((link) => link.source === 'mirbase')?.url
    // Sorts descendant to put MIMAT format first
    const miRNAAliases = miRNAData.aliases.sort((a, b) => b.localeCompare(a)).join(' / ')

    return (
        <Grid className='margin-bottom-2' centered>
            <Grid.Row divided centered>
                <Grid.Column width={miRNAData.links.length ? 6 : 8} title={intl.formatMessage({ id: 'miRNAExtraData.aliases' })} textAlign='center' verticalAlign='middle'>
                    <Header size='large'>
                        <LinkOrPlainText url={mirbaseURL} text={miRNAAliases} />
                    </Header>
                </Grid.Column>

                {miRNAData.mirna_sequence && (
                    <Grid.Column width={8} title={intl.formatMessage({ id: 'miRNAExtraData.sequence' })} verticalAlign='middle'>
                        <Header size='large'>
                            {miRNAData.mirna_sequence}
                        </Header>
                    </Grid.Column>
                )}

                {(miRNAData.links.length > 0) && (
                    <Grid.Column width={2} verticalAlign='middle'>
                        {miRNAData.links.map((link) => (
                            <Button
                                key={link.source}
                                basic
                                color='blue'
                                icon={link.source !== 'mirbase'}
                                title={link.source === 'mirbase' ? 'miRBase' : link.source}
                                className='borderless-button no-box-shadow'
                                as='a' href={link.url} target='_blank' rel='noopener noreferrer'
                            >
                                {link.source === 'mirbase' ? 'miRBase' : <Icon name='linkify' />}
                            </Button>
                        ))}
                    </Grid.Column>
                )}
            </Grid.Row>
        </Grid>
    )
}
