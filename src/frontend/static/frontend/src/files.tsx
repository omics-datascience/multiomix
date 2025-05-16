import React from 'react'
import './css/files.css'

import { FilesManager } from './components/files-manager/FilesManager'
import { ConfirmModal } from './utils/interfaces'
import { Confirm } from 'semantic-ui-react'
import { createRoot } from 'react-dom/client'

type FileState = {
     confirmModal: ConfirmModal
    };

class FilesApp extends React.Component<{}, FileState> {
    constructor (props) {
        super(props)
        this.state = {
            confirmModal: this.getDefaultConfirmModal()
        }
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => {
        const confirmModal = this.state.confirmModal
        confirmModal.confirmModal = setOption
        confirmModal.headerText = headerText
        confirmModal.contentText = contentText
        confirmModal.onConfirm = onConfirm
        this.setState({ confirmModal },
            () => {
                if (this.state.confirmModal.confirmModal === true) {
                    console.log('Confirm modal is true')
                } else if (this.state.confirmModal.confirmModal === false) {
                    console.log('Confirm modal is false')
                }
            })
    }

    /**
     * Reset the confirm modal, to be used again
     */
    handleCancelConfirmModalState () {
        this.setState(
            { confirmModal: this.getDefaultConfirmModal() },
            () => {
                if (this.state.confirmModal.confirmModal === true) {
                    console.log('Confirm modal is true')
                } else if (this.state.confirmModal.confirmModal === false) {
                    console.log('Confirm modal is false')
                }
            }
        )
    }

    /**
     * Default modal.
     * @returns {ConfirmModal} Confirm modal base
     */
    getDefaultConfirmModal = (): ConfirmModal => {
        return {
            confirmModal: false,
            headerText: '',
            contentText: '',
            onConfirm: () => console.log('DefaultConfirmModalFunction, this should change during cycle of component')
        }
    }

    render () {
        return (
            <div id="files-app" className="files-app">
                <FilesManager handleChangeConfirmModalState={this.handleChangeConfirmModalState} />
                <Confirm
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => {
                        this.handleCancelConfirmModalState()
                        this.state.confirmModal.onConfirm()
                    }}
                />
            </div>
        )
    }
}
const container = document.getElementById('files-app')
const root = createRoot(container!)
root.render(<FilesApp />)
