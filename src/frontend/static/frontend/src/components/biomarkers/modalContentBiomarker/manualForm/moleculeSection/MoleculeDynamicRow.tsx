import React, { useRef } from 'react'
import { BiomarkerType, MoleculesSectionData } from '../../../types'
import { MoleculeOption } from './MoleculeOption'

// Styles
import './moleculeSectionStyles.css'

/** MoleculeDynamicRow props. */
interface MoleculeDynamicRowProps {
    content: MoleculesSectionData[],
    title: BiomarkerType,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,

}

/**
 * Internal component to measure the height of the dynamic content in each row.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculeDynamicRow = (props: MoleculeDynamicRowProps) => {
    const measuredRef = useRef<HTMLDivElement>(null)

    const { title, content, handleSelectOptionMolecule, handleRemoveMolecule } = props

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
