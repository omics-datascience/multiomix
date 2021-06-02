import React from 'react'
import { DjangoUserFile } from '../../utils/django_interfaces'
import { Card, Button, Icon } from 'semantic-ui-react'
import { TagLabel } from '../common/TagLabel'
import { getFileRowDescriptionInPlural } from '../../utils/util_functions'
import { FileType } from '../../utils/interfaces'

/**
 * Component's props
 */
interface FileCardProps {
    /** File to show info in the card */
    file: DjangoUserFile,
    /** If specified, shows a button which uses this callback */
    confirmFileDeletion: (file: DjangoUserFile) => void,
    /** On double click callback */
    onDoubleClick: (file: DjangoUserFile, event: any) => void,
    /** Edit button callback */
    editCallback: (file: DjangoUserFile) => void
}

/**
 * Render a card with a User's props.file information
 * @param props Component's props
 * @returns Component
 */
const FileCard = (props: FileCardProps) => {
    const institutionsNames = props.file.institutions.map((institution) => institution.name).join(', ')
    const canEditOrDelete = props.file.is_private_or_institution_admin
    let cardClassName: string
    let cardDoubleClickCallback
    if (canEditOrDelete) {
        cardClassName = 'clickable'
        cardDoubleClickCallback = (e) => props.onDoubleClick(props.file, e)
    } else {
        cardClassName = ''
        cardDoubleClickCallback = () => {}
    }

    // Gets file's type description in plural to show the number of rows
    const fileRowDescriptionInPlural = getFileRowDescriptionInPlural(props.file.file_type)

    // For clinical data, the numbers are inverted are datasets are commonly transposed
    let numberOfRows: number
    let numberOfSamples: number
    if (props.file.file_type === FileType.CLINICAL) {
        numberOfRows = props.file.number_of_samples
        numberOfSamples = props.file.number_of_rows
    } else {
        numberOfRows = props.file.number_of_rows
        numberOfSamples = props.file.number_of_samples
    }

    return (
        <Card
            raised
            className={cardClassName}
            onDoubleClick={cardDoubleClickCallback}
        >
            <Card.Content textAlign='left'>
                <Card.Header className='ellipsis' title={props.file.name}>{props.file.name}</Card.Header>
                <Card.Meta>
                    <p>{props.file.description ? props.file.description : 'No description'}</p>

                    <TagLabel tag={props.file.tag}/>

                    {props.file.institutions.length > 0 &&
                        <Icon
                            name='building'
                            size='large'
                            title={`This dataset is shared with ${institutionsNames}`}
                        />
                    }
                </Card.Meta>
                <Card.Description>
                    {new Date(props.file.upload_date as string).toDateString()}
                    <p>
                        {numberOfRows} {fileRowDescriptionInPlural} | {numberOfSamples} samples
                    </p>
                </Card.Description>
            </Card.Content>

            {/* Extra content */}
            <Card.Content extra>
                {/* Shows a download button if specified */}
                <Button
                    icon
                    as='a'
                    href={props.file.file_obj}
                    target="_blank"
                    color="blue"
                    title="Download file"
                >
                    <Icon name='cloud download' />
                </Button>

                {/* Users can modify or delete own files or the ones which belongs to an
                Institution which the user is admin of */}
                {canEditOrDelete &&
                    <React.Fragment>
                        {/* Shows a edit button if specified */}
                        <Button icon color="yellow" onClick={() => props.editCallback(props.file)} title="Edit file">
                            <Icon name='pencil' />
                        </Button>

                        {/* Shows a delete button if specified */}
                        <Button icon color="red" onClick={() => props.confirmFileDeletion(props.file)} title="Delete file">
                            <Icon name='trash' />
                        </Button>
                    </React.Fragment>
                }

                {/* Extra information: */}
                <Icon
                    name='info'
                    className='margin-left-2'
                    color='blue'
                    title={`The column "${props.file.column_used_as_index}" will be used as index`}
                />

                {/* NaNs warning */}
                {props.file.contains_nan_values &&
                    <Icon
                        name='warning sign'
                        className='margin-left-2'
                        color='yellow'
                        title='The dataset contains NaN values'
                    />
                }
            </Card.Content>
        </Card>
    )
}

export { FileCard }
