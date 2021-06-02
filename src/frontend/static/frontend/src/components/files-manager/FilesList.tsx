import React from 'react'
import { Card } from 'semantic-ui-react'
import { DjangoUserFile } from '../../utils/django_interfaces'
import { FileCard } from './FileCard'

/**
 * Component's props
 */
interface FilesListProps {
    files: DjangoUserFile[],
    editFile: (fileToEdit: DjangoUserFile) => void,
    confirmFileDeletion: (file: DjangoUserFile) => void,
}

/**
 * Renders a CRUD panel for source files
 * @param props Component's props
 * @returns Component
 */
export const FilesList = (props: FilesListProps) => {
    return (
        <Card.Group itemsPerRow={6}>
            {props.files.map((file) => (
                <FileCard
                    key={file.id}
                    file={file}
                    onDoubleClick={props.editFile}
                    confirmFileDeletion={props.confirmFileDeletion}
                    editCallback={props.editFile}
                />
            ))}
        </Card.Group>
    )
}
