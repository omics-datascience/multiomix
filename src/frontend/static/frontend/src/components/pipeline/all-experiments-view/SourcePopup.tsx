import React from 'react'
import { Popup, Button, Icon, Header, List } from 'semantic-ui-react'
import { DjangoExperimentSource, SourceSimpleCGDSDataset } from '../../../utils/django_interfaces'
import { SemanticICONS, SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'
import { formatDateLocale, getFileRowDescriptionInPlural } from '../../../utils/util_functions'

declare const downloadFileURL: string

/**
 * Component's props
 */
interface SourcePopupProps {
    /** Experiment's source to retrieve the info */
    source: DjangoExperimentSource,
    /** Trigger icon's name */
    iconName: SemanticICONS,
    /** Trigger icon's color */
    iconColor: SemanticCOLORS,
    /** Download button's title */
    downloadButtonTitle: string
}

/**
 * Generates a button with a Popup which shows some info about an Experiment's source
 * and a download button
 * @param props Component's props
 * @returns Component
 */
export const SourcePopup = (props: SourcePopupProps) => {
    const isUserFile = props.source.user_file !== null
    const datasetObj = props.source.user_file ?? props.source.cgds_dataset

    // Gets file's type description in plural to show the number of rows
    const datasetRowDescriptionInPlural = getFileRowDescriptionInPlural(datasetObj.file_type)

    /**
     * Gets the some extra content of the Popup for a CGDS dataset.
     * @param obj CGDS dataset object.
     * @returns JSX content.
     */
    const getCGDSData = (obj: SourceSimpleCGDSDataset): JSX.Element => {
        const syncDate = obj.date_last_synchronization ? formatDateLocale(obj.date_last_synchronization) : '-'

        return (
            <>
                <hr />
                <List.Item>
                    <List.Icon name='database' color='blue' />
                    <List.Content>cBioPortal dataset (version {obj.version})</List.Content>
                </List.Item>
                <List.Item>
                    <List.Icon name='clock' color='blue' />
                    <List.Content>Sync. Date: {syncDate}</List.Content>
                </List.Item>
            </>
        )
    }

    return (
        <Popup
            on='click'
            pinned
            position='left center'
            wide='very'
            size='large'
            trigger={
                <Button
                    basic
                    color={props.iconColor}
                    icon
                    className='borderless-button'
                >
                    <Icon name={props.iconName} />
                </Button>
            }
        >
            {/* Popup content */}
            <>
                <Header as='h3' content={datasetObj.name} />
                <p>{datasetObj.description ? datasetObj.description : ''}</p>
                <List>
                    {/* Number of rows and samples */}
                    <List.Item>
                        <List.Content>
                            <List.Header className='source-popup-header'>Source properties</List.Header>
                            <List.List>
                                <List.Item>
                                    <List.Icon name='numbered list' color='blue' className='no-padding-left' />
                                    <List.Content>{datasetRowDescriptionInPlural}: {props.source.number_of_rows}</List.Content>
                                </List.Item>
                                <List.Item>
                                    <List.Icon name='users' color='blue' />
                                    <List.Content>Samples: {props.source.number_of_samples}</List.Content>
                                </List.Item>

                                {/* CGDS data */}
                                {props.source.cgds_dataset &&
                                    getCGDSData(datasetObj as SourceSimpleCGDSDataset)
                                }
                            </List.List>
                        </List.Content>
                    </List.Item>
                </List>

                {/* Download button */}
                <Button
                    basic
                    fluid
                    color="green"
                    title={props.downloadButtonTitle}
                    as='a' href={`${downloadFileURL}${datasetObj.id}`} target='_blank'
                    disabled={!isUserFile}
                >
                    <Icon name='cloud download' />
                    Download
                </Button>
            </>
        </Popup>
    )
}
