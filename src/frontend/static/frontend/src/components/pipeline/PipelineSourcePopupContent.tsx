import React from 'react'
import { Header, List } from 'semantic-ui-react'

declare const urlDatasets: string

/**
 * Renders an info popup for Pipeline's source selector panel
 * @returns Component
 */
export const PipelineSourcePopupContent = () => (
    <React.Fragment>
        <Header>New experiment</Header>

        <p>In this panel you can select the source data which will be used to compute a correlation analysis. There are three different ways to select a source:</p>

        <List>
            <List.Item>
                <List.Icon name='folder' />
                <List.Content>
                    <List.Header>From multiomix</List.Header>
                    <List.Description>
                        Uploaded datasets from <a href={urlDatasets} target='_blank' rel='noopener noreferrer'>Datasets/Multiomix</a> menu
                    </List.Description>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='cloud download' />
                <List.Content>
                    <List.Header>From cBioPortal</List.Header>
                    <List.Description>
                        Datasets synchronized from <a href='https://www.cbioportal.org/datasets' target='_blank' rel='noopener noreferrer'>cBioPortal</a> ready to use!
                    </List.Description>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='upload' />
                <List.Content>
                    <List.Header>Upload dataset</List.Header>
                    <List.Description>
                        You can upload a dataset from your computer. It will be stored and appear in <a href={urlDatasets} target='_blank' rel='noopener noreferrer'>Datasets/Multiomix</a> menu. <strong>It will be private and only accessible for you (you can share it from <a href={urlDatasets} target='_blank' rel='noopener noreferrer'>Datasets/Multiomix</a> menu)</strong>
                    </List.Description>
                </List.Content>
            </List.Item>
        </List>

        {/* TODO: When is implemented NaNs manager, this comment will be modified */}
        <p>
            Keep in mind that <strong>only samples in common will be evaluated</strong> and <strong>Genes/GEMs that contains NaNs value will be removed</strong>
        </p>
    </React.Fragment>
)
