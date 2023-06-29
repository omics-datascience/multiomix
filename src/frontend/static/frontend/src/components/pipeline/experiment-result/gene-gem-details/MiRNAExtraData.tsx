import React from 'react'
import { Button, Grid, Header, Icon } from 'semantic-ui-react'
import { DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import { Nullable } from '../../../../utils/interfaces'
import { ExternalLink } from '../../../common/ExternalLink'

/** LinkOrPlainText props. */
interface LinkOrPlainTextProps {
    url: string | undefined,
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
    miRNA: string,
    miRNAData: Nullable<DjangoMiRNADataJSON>
}

/**
 * Renders a grid with miRNA extra data
 * @param props Component's props
 * @returns Component
 */
export const MiRNAExtraData = (props: MiRNAExtraDataProps) => {
    if (!props.miRNAData) {
        return null
    }

    const mirbaseURL = props.miRNAData.links.find((link) => link.source === 'mirbase')?.url
    const othersLinks = props.miRNAData.links.filter((link) => link.source !== 'mirbase')

    // Sorts descendant to put MIMAT format first
    const miRNAAliases = props.miRNAData.aliases.sort((a, b) => b.localeCompare(a)).join(' / ')

    return (
        <Grid>
            <Grid.Row divided>
                <Grid.Column width={6} title='miRNA aliases' textAlign='center' verticalAlign='middle'>
                    <Header size='large'>
                        <LinkOrPlainText url={mirbaseURL} text={miRNAAliases} />
                    </Header>
                </Grid.Column>

                {props.miRNAData.mirna_sequence &&
                    <Grid.Column width={8} title='Sequence' verticalAlign='middle'>
                        <Header size='large'>
                            {props.miRNAData.mirna_sequence}
                        </Header>
                    </Grid.Column>
                }
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
            </Grid.Row>
        </Grid>
    )
}
