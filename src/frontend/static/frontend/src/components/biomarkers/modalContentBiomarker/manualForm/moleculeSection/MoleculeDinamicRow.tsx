import React, { FC, useRef } from 'react'
import { BiomarkerType, MoleculesSectionData } from '../../../types'
import { MoleculeOption } from './MoleculeOption'

// Styles
import './moleculeSectionStyles.css'

// Componente interno para medir la altura del contenido dinámico en cada fila
interface Props {
    content: MoleculesSectionData[];
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
    title: BiomarkerType,

}

export const MoleculeDinamicRow: FC<Props> = ({ title, content, handleSelectOptionMolecule, handleRemoveMolecule }) => {
    const measuredRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={measuredRef}
            className={content.length === 1 ? '' : 'row-container'}
            style={{ flex: 1 }}
        >
            {
                content.map((mol, i) => (
                    <MoleculeOption
                        key={i}
                        mol={mol}
                        handleRemoveMolecule={handleRemoveMolecule}
                        title={title}
                        index={i}
                        handleSelectOptionMolecule={handleSelectOptionMolecule}
                    />
                ))
            }
        </div >
    )
}
