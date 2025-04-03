import React from 'react'
import { Button } from 'semantic-ui-react'
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'
import { ACCEPTED_FILE_TYPES } from '../../utils/constants'

/**
 * Component's props
 */
interface UploadButtonProps {
    content: string,
    title: string,
    inputRef: React.RefObject<any>,
    color?: SemanticCOLORS,
    fileChangeEvent: (e: any) => void
}

/**
 * Renders an upload button using ref
 * @param props Component's props
 * @returns Component
 */
export const UploadButton = (props: UploadButtonProps) => {
    return (
        <Button
            icon
            fluid
            title={props.title}
            className='ellipsis'
            color={props.color ? props.color : 'blue'}
            onClick={() => props.inputRef.current.click()}
        >
            {/* Content of the button */}
            {props.content}

            {/* Hidden input for ref */}
            <input
                ref={props.inputRef}
                type='file'
                accept={ACCEPTED_FILE_TYPES}
                hidden
                onChange={props.fileChangeEvent}
            />
        </Button>
    )
}
