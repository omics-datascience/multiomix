import ky from 'ky'
import * as SparkMD5 from 'spark-md5'

// TODO: add docs
type ChunkFileUploaderConfig = {
    url: string,
    urlComplete: string,
    headers: Headers,
    file: File,
    /** Any extra data to send when the upload is complete. If not specified an empty FormData is assigned. */
    completeData?: FormData, // Django chunk library needs data in a FormData
    /** Chunk size in bytes. Default `104857600` (100MB). */
    chunkSize?: number,
    /** Callback on every chunk upload. Receives the percentage of the file currently uploaded. */
    onChunkUpload?: (percentDone: number) => void
}

// TODO: add docs
type ChunkUploadResponse = { upload_id: string, offset: number, expires: string}

// TODO: complete docs and instance variables
class ChunkFileUploader {
    private url: string
    private urlComplete: string
    private headers: Headers
    private file: File
    private completeData: FormData
    private chunkSize: number
    private onChunkUpload?: (percentDone: number) => void

    public constructor (config: ChunkFileUploaderConfig) {
        this.url = config.url
        this.urlComplete = config.urlComplete
        this.headers = config.headers
        this.file = config.file
        this.completeData = config.completeData ?? new FormData()
        this.chunkSize = config.chunkSize ?? 104857600 // 100MB
        this.onChunkUpload = config.onChunkUpload
    }

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

            /**
             * TODO: complete
             */
            const loadNext = () => {
                var start = currentChunk * this.chunkSize
                var end = ((start + this.chunkSize) >= this.file.size) ? this.file.size : start + this.chunkSize

                fileReader.readAsArrayBuffer(this.file.slice(start, end))
            }

            loadNext()
        })

        return promise
    }

    /**
     * TODO: complete
     * @param uploadId
     * @returns
     */
    private completeUpload<T> (uploadId: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.calculateMD5().then((md5) => {
                this.completeData.append('upload_id', uploadId)
                this.completeData.append('md5', md5.toString())

                ky.post(this.urlComplete, { headers: this.headers, body: this.completeData, timeout: false }).then((response) => {
                    response.json().then((responseJSON: T) => {
                        resolve(responseJSON)
                    }).catch(reject)
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * TODO: complete
     */
    public uploadFile<T> (): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const reader = new FileReader()
            const file = this.file

            /**
             * TODO: complete
             * @param start
             */
            const getContentRange = (start: number) => {
                const end = Math.min(start + this.chunkSize, file.size)
                return `bytes ${start}-${end - 1}/${file.size}`
            }

            /**
             * TODO: complete
             * @param start
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

                        // TODO: use both below const to send to a callback for each chunk
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
 * TODO: complete this doc and the above one
 * @param config
 */
function startUpload<T> (config: ChunkFileUploaderConfig): Promise<T> {
    const uploader = new ChunkFileUploader(config)
    return uploader.uploadFile()
}

export { startUpload }
