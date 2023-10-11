import ky from 'ky'
import * as SparkMD5 from 'spark-md5'

/** Enum indicating current state of a file upload. */
enum UploadState {
    /** Indicates that chunks are being uploaded. */
    UPLOADING_CHUNKS = 0,
    /** Indicates that JS is computing MD5 hash in browser. */
    COMPUTING_MD5 = 1,
    /** Indicates that Django is checking MD5 and other things like decimal separator and valid cells values. */
    CHECKING_IN_BACKEND = 2
}

/** Upload service configuration. */
type ChunkFileUploaderConfig = {
    /** URL to send every chunk. */
    url: string,
    /** URL to complete the upload after every chunk was successfully uploaded. */
    urlComplete: string,
    /** Extra headers to send to backend. */
    headers: Headers,
    /** File to send. */
    file: File,
    /** Any extra data to send when the upload is complete. If not specified an empty FormData is assigned. */
    completeData?: FormData, // Django chunk library needs data in a FormData
    /** Chunk size in bytes. Default `104857600` (100MB). */
    chunkSize?: number,
    /** Callback on every chunk upload. Receives the percentage of the file currently uploaded. */
    onChunkUpload?: (percentDone: number) => void,
    /** Callback on every upload state change. */
    onUploadStateChange?: (currentState: UploadState) => void
}

/** Response structure from the Django chunk upload library. */
type ChunkUploadResponse = { upload_id: string, offset: number, expires: string}

/** Util class to upload a file in chunks. */
class ChunkFileUploader {
    // TODO: refactor to just config
    private url: string
    private urlComplete: string
    private headers: Headers
    private file: File
    private completeData: FormData
    private chunkSize: number
    private onChunkUpload?: (percentDone: number) => void
    private onUploadStateChange?: (currentState: UploadState) => void

    public constructor (config: ChunkFileUploaderConfig) {
        this.url = config.url
        this.urlComplete = config.urlComplete
        this.headers = config.headers
        this.file = config.file
        this.completeData = config.completeData ?? new FormData()
        this.chunkSize = config.chunkSize ?? 104857600 // 100MB
        this.onChunkUpload = config.onChunkUpload
        this.onUploadStateChange = config.onUploadStateChange
    }

    /**
     * Computes MD5 hash to check in backend.
     * @returns MD5 hash in hexadecimal.
     */
    private calculateMD5 (): Promise<number> {
        const promise = new Promise<number>((resolve, reject) => {
            const chunks = Math.ceil(this.file.size / this.chunkSize)
            const spark = new SparkMD5.ArrayBuffer()
            const fileReader = new FileReader()
            let currentChunk = 0

            fileReader.onload = (e) => {
                spark.append(e?.target?.result)
                currentChunk++

                if (currentChunk < chunks) {
                    loadNext()
                } else {
                    // Computes hash
                    resolve(spark.end())
                }
            }

            fileReader.onerror = (e) => {
                reject(e)
            }

            /** Reads next chunk of file. */
            const loadNext = () => {
                const start = currentChunk * this.chunkSize
                const end = ((start + this.chunkSize) >= this.file.size) ? this.file.size : start + this.chunkSize

                fileReader.readAsArrayBuffer(this.file.slice(start, end))
            }

            loadNext()
        })

        return promise
    }

    /**
     * Sends last request to finish the file upload.
     * @param uploadId Upload ID to check in backend
     * @returns A promise with the backend response
     */
    private completeUpload<T> (uploadId: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (this.onUploadStateChange) {
                this.onUploadStateChange(UploadState.COMPUTING_MD5)
            }

            this.calculateMD5().then((md5) => {
                this.completeData.append('upload_id', uploadId)
                this.completeData.append('md5', md5.toString())

                if (this.onUploadStateChange) {
                    this.onUploadStateChange(UploadState.CHECKING_IN_BACKEND)
                }

                ky.post(this.urlComplete, { headers: this.headers, body: this.completeData, timeout: false }).then((response) => {
                    response.json().then((responseJSON: T) => {
                        resolve(responseJSON)
                    }).catch(reject)
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Uploads a file
     * @returns A promise with the backend response.
     */
    public uploadFile<T> (): Promise<T> {
        if (this.onUploadStateChange) {
            this.onUploadStateChange(UploadState.UPLOADING_CHUNKS)
        }

        return new Promise<T>((resolve, reject) => {
            const reader = new FileReader()
            const file = this.file

            /**
             * Generates the HTTP head 'Content-Range' which is needed in backend to check offsets.
             * @param start Offset start.
             * @returns HTTP header content.
             */
            const getContentRange = (start: number): string => {
                const end = Math.min(start + this.chunkSize, file.size)
                return `bytes ${start}-${end - 1}/${file.size}`
            }

            /**
             * Reads the next chunk of the file from an offset.
             * @param start Start offset to read from.
             */
            const loadNextFrom = (start: number) => {
                reader.readAsArrayBuffer(file.slice(start, start + this.chunkSize))
            }

            this.headers.set('Content-Range', getContentRange(0))

            const formData = new FormData()

            reader.onloadend = (event) => {
                if (event?.target?.readyState !== FileReader.DONE) {
                    return
                }

                const fileChunk = event?.target?.result as string
                const blobChunk = new Blob([fileChunk], { type: 'text/plain' })
                formData.set('file_obj', blobChunk, file.name)

                ky.post(this.url, { headers: this.headers, body: formData, timeout: false }).then((response) => {
                    response.json().then((responseJSON: ChunkUploadResponse) => {
                        const offset = responseJSON.offset

                        const sizeDone = Math.min(file.size, responseJSON.offset)
                        const percentDone = Math.floor((sizeDone / file.size) * 100)

                        // Call the callback
                        if (this.onChunkUpload) {
                            this.onChunkUpload(percentDone)
                        }

                        // To keep track of file ID
                        const uploadId = responseJSON.upload_id

                        if (uploadId.length > 0) {
                            formData.append('upload_id', uploadId)
                            this.headers.set('Content-Range', getContentRange(offset))
                        }

                        if (offset < file.size) {
                            // Reads next chunk
                            loadNextFrom(offset)
                        } else {
                            // Once it's finished must send data to final view
                            this.completeUpload(uploadId).then(resolve).catch(reject)
                        }
                    }).catch(reject)
                }).catch(reject)
            }

            loadNextFrom(0)
        })
    }
}

/**
 * Uploads a file in chunks.
 * @param config Configuration as URLs and callbacks.
 * @returns A promise with the backend response.
 */
function startUpload<T> (config: ChunkFileUploaderConfig): Promise<T> {
    const uploader = new ChunkFileUploader(config)
    return uploader.uploadFile()
}

export { startUpload, UploadState }
