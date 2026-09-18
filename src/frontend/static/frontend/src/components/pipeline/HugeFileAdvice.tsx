import React from 'react'
import { Label } from 'semantic-ui-react'
import { MAX_FILE_SIZE_IN_MB_ERROR, MAX_FILE_SIZE_IN_MB_WARN } from '../../utils/constants'
import { getFileSizeInMB } from '../../utils/util_functions'
import { useIntl, FormattedMessage } from 'react-intl'

// Constants declared in base.html
declare const urlDatasets: string

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
    const intl = useIntl()
    const sizeInMB = getFileSizeInMB(props.fileSize)

    if (sizeInMB < MAX_FILE_SIZE_IN_MB_WARN) {
        return null
    }

    if (sizeInMB < MAX_FILE_SIZE_IN_MB_ERROR) {
        // Just shows the warning
        return (
            <Label className='margin-top-2' color='orange'>
                {intl.formatMessage(
                    { id: 'hugeFileAdvice.uploadDelayWarning' },
                    { size: MAX_FILE_SIZE_IN_MB_WARN }
                )}
            </Label>
        )
    }

    // Prevents over complexity. Promotes the usage of 'My datasets' panel which has more features and validations
    return (
        <Label className='margin-top-2' color='red'>
            <FormattedMessage
                id='hugeFileAdvice.uploadFromDatasets'
                values={{
                    size: MAX_FILE_SIZE_IN_MB_ERROR,
                    link: (
                        <a
                            id='huge-size-msg-link'
                            href={urlDatasets}
                        >
                            {intl.formatMessage({ id: 'hugeFileAdvice.myDatasets' })}
                        </a>
                    ),
                }}
            />
        </Label>
    )
}
