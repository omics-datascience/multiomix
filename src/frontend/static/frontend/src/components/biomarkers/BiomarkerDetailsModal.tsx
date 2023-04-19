import React, { useState } from 'react'
import { ActiveBiomarkerDetailItemMenu, Biomarker } from './types'
import { Nullable } from '../../utils/interfaces'
import { Menu } from 'semantic-ui-react'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'

interface BiomarkerDetailsModalProps {
    /** Selected Biomarker instance to show its details. */
    selectedBiomarker: Nullable<Biomarker>,
    /** Active item in the  */

}

/**
 * TODO: complete and correct all the InfoPopups
 * @param props 
 * @returns 
 */
export const BiomarkerDetailsModal = (props: BiomarkerDetailsModalProps) => {
    const [activeItem, setActiveItem] = useState<ActiveBiomarkerDetailItemMenu>(ActiveBiomarkerDetailItemMenu.DETAILS)

    if (!props.selectedBiomarker) {
        return null
    }

    return (
        <Menu className='menu-with-bolder-border'>
            <Menu.Item
                active={activeItem === ActiveBiomarkerDetailItemMenu.DETAILS}
                onClick={() => setActiveItem(ActiveBiomarkerDetailItemMenu.DETAILS)}
            >
                Details

                <InfoPopup
                    content={`Stats of the correlation and also of each value vector separately `}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={activeItem === ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY}
                onClick={() => setActiveItem(ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY)}
            >
                Feature Selection

                <InfoPopup
                    content={`Correlation graph between and also stats to measure the correlation`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={activeItem === ActiveBiomarkerDetailItemMenu.MODELS}
                onClick={() => setActiveItem(ActiveBiomarkerDetailItemMenu.MODELS)}
            >
                Trained models

                <InfoPopup
                    content={`Scores, given by external databases, that measures the association between`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={activeItem === ActiveBiomarkerDetailItemMenu.STATISTICAL_VALIDATION}
                onClick={() => setActiveItem(ActiveBiomarkerDetailItemMenu.STATISTICAL_VALIDATION)}
            >
                Statistical validation

                <InfoPopup
                    content={`Find target interactions with in miRNA external databases`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={activeItem === ActiveBiomarkerDetailItemMenu.PREDICT}
                onClick={() => setActiveItem(ActiveBiomarkerDetailItemMenu.PREDICT)}
            >
                Predict

                <InfoPopup
                    content={`Diseases associated with in miRNA external databases`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>
        </Menu>
    )
}
