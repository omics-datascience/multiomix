import React from 'react'
import { Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader } from 'semantic-ui-react'

export interface SharedInstitutionsProps {
    isOpen: boolean,
    institutions: [],
}
interface Props extends SharedInstitutionsProps {
    handleClose: VoidFunction
}

export const SharedInstitutions = (props: Props) => {
    return (
        <Modal
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={() => props.handleClose()} />}
        >
            <ModalHeader>Select a Photo</ModalHeader>
            <ModalContent>
                <List selection verticalAlign='middle'>
                    <ListItem>
                        <ListContent>
                            <ListHeader>Helen</ListHeader>
                        </ListContent>
                    </ListItem>
                </List>
            </ModalContent>
        </Modal>
    )
}
