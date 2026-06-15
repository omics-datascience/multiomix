import React from 'react'
import { useIntl } from 'react-intl'
import { Header, List } from 'semantic-ui-react'
import { ExternalLink } from '../common/ExternalLink'

declare const urlDatasets: string

/**
 * Renders an info popup for Pipeline's source selector panel
 * @returns Component
 */
export const PipelineSourcePopupContent = () => {
    const intl = useIntl()

    return (
        <>
            <Header>
                {intl.formatMessage({ id: 'pipelineSourcePopupContent.newExperiment' })}
            </Header>

            <p>
                {intl.formatMessage({ id: 'pipelineSourcePopupContent.description' })}
            </p>

            <List>
                <List.Item>
                    <List.Icon name='folder' />
                    <List.Content>
                        <List.Header>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.fromMultiomix' })}
                        </List.Header>
                        <List.Description>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.fromMultiomixDescription' })}{' '}
                            <ExternalLink href={urlDatasets}>Datasets/Multiomix</ExternalLink> menu
                        </List.Description>
                    </List.Content>
                </List.Item>

                <List.Item>
                    <List.Icon name='cloud download' />
                    <List.Content>
                        <List.Header>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.fromCBioPortal' })}
                        </List.Header>
                        <List.Description>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.fromCBioPortalDescription' })}{' '}
                            <ExternalLink href='https://www.cbioportal.org/datasets'>cBioPortal</ExternalLink>
                        </List.Description>
                    </List.Content>
                </List.Item>

                <List.Item>
                    <List.Icon name='upload' />
                    <List.Content>
                        <List.Header>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.uploadDataset' })}
                        </List.Header>
                        <List.Description>
                            {intl.formatMessage({ id: 'pipelineSourcePopupContent.uploadDatasetDescription' })}{' '}
                            <ExternalLink href={urlDatasets}>Datasets/Multiomix</ExternalLink> menu.{' '}
                            <strong>
                                {intl.formatMessage({ id: 'pipelineSourcePopupContent.uploadDatasetPrivacy' })}{' '}
                                (
                                <ExternalLink href={urlDatasets}>Datasets/Multiomix</ExternalLink>
                                {' '}menu)
                            </strong>
                        </List.Description>
                    </List.Content>
                </List.Item>
            </List>

            <p>
                <strong>
                    {intl.formatMessage({ id: 'pipelineSourcePopupContent.samplesWarning' })}
                </strong>
            </p>
        </>
    )
}
