import React from 'react'
import { Modal, Header, Button } from 'semantic-ui-react'
import { DjangoUser, DjangoInstitution } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'

/**
 * Component's props
 */
interface RemoveUserFromInstitutionModalProps {
    /** Selected User to remove from Institution */
    selectedUserToRemove: Nullable<DjangoUser>,
    /** Selected Institution */
    selectedInstitution: Nullable<DjangoInstitution>,
    /** Flag to show the modal */
    showRemoveUserModal: boolean,
    /** Flag to show a loading during request */
    removingUserFromInstitution: boolean,
    /** Callback to hide the modal */
    handleClose: () => void,
    /** Callback to remove the User from the Institution */
    removeUser: () => void,
}

/**
 * Renders a modal to confirm the removal of an User from an Institution
 * @param props Component's props
 * @returns Component
 */
export const RemoveUserFromInstitutionModal = (props: RemoveUserFromInstitutionModalProps) => {
    if (!props.selectedUserToRemove || !props.selectedInstitution) {
        return null
    }

    return (
        <Modal size='small' open={props.showRemoveUserModal} onClose={props.handleClose} centered={false}>
            <Header icon='trash' content='Remove User from Institution' />
            <Modal.Content>
                Are you sure you want to remove <strong>{props.selectedUserToRemove.username}</strong> from the Institution <strong>{props.selectedInstitution.name}</strong>?
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={props.handleClose}>
                    Cancel
                </Button>
                <Button color='red' onClick={props.removeUser} loading={props.removingUserFromInstitution} disabled={props.removingUserFromInstitution}>
                    Remove
                </Button>
            </Modal.Actions>
        </Modal>
    )
}
