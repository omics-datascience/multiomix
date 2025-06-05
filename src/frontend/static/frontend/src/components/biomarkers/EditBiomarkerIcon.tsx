import React, { useContext } from 'react'
import { Icon } from 'semantic-ui-react'
import { CurrentUserContext } from '../Base'
import { BiomarkerSimple } from './types'

interface Props {
    handleOpenEditBiomarker: (biomarker: BiomarkerSimple) => void,
    biomarker: BiomarkerSimple,
    ownerId: number,
    currentBiomarkerIsLoading: boolean,
    canEditMolecules: boolean,
    isLoadingFullBiomarker: boolean,
}

export const EditBiomarkerIcon = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)

    if (props.ownerId !== currentUser?.id) {
        return <></>
    }

    return (
        <Icon
            name={props.currentBiomarkerIsLoading ? 'spinner' : 'pencil'}
            className='clickable margin-left-5'
            color={props.canEditMolecules ? 'yellow' : 'orange'}
            loading={props.currentBiomarkerIsLoading}
            disabled={props.isLoadingFullBiomarker}
            title={`Edit (${props.canEditMolecules ? 'full' : 'name and description'}) biomarker`}
            onClick={() => props.handleOpenEditBiomarker(props.biomarker)}
        />
    )
}
