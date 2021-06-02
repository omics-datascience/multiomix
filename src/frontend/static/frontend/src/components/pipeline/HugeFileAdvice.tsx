import React from 'react'
import { Label } from 'semantic-ui-react'
import { MAX_FILE_SIZE_IN_MB } from '../../utils/constants'
import { getFileSizeInMB } from '../../utils/util_functions'

/**
 * Component's props
 */
interface HugeFileAdviceProps {
    /** File size in bytes */
    fileSize: number
}

/**
 * Renders an orange warning if the file size is too big to advice the user
 * of a possible upload delay
 * @param props Component's props
 * @returns Component
 */
export const HugeFileAdvice = (props: HugeFileAdviceProps) => {
    const sizeInMB = getFileSizeInMB(props.fileSize)
    if (sizeInMB < MAX_FILE_SIZE_IN_MB) {
        return null
    }

    return (
        <Label className="margin-top-2" color="orange">
            The file exceeds {MAX_FILE_SIZE_IN_MB}MB, please take into consideration that the upload may take some time
        </Label>
    )
}
