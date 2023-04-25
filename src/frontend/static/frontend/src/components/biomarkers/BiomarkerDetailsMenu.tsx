import React from 'react'
import { Menu } from 'semantic-ui-react'
import { ActiveBiomarkerDetailItemMenu, Biomarker } from './types'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'

/** BiomarkerDetailsMenu props. */
interface BiomarkerDetailsMenuProps {
    /** Selected Biomarker instance to show its details. */
    selectedBiomarker: Biomarker,
    /** Getter of the active item in the menu. */
    activeItem: ActiveBiomarkerDetailItemMenu,
    /** Setter of the active item in the menu. */
    setActiveItem: (activeItem: ActiveBiomarkerDetailItemMenu) => void,
}

/**
 * Renders the menu for the modal of Biomarker's details.
 * TODO: fix all the popups messages
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerDetailsMenu = (props: BiomarkerDetailsMenuProps) => {
    return (
        <Menu className='menu-with-bolder-border'>
            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.DETAILS}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.DETAILS)}
            >
                Details

                <InfoPopup
                    content={`Stats of the correlation and also of each value vector separately `}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            {props.selectedBiomarker.has_fs_experiment &&
                <Menu.Item
                    active={props.activeItem === ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY}
                    onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY)}
                >
                    Feature Selection

                    <InfoPopup
                        content={`Correlation graph between and also stats to measure the correlation`}
                        onTop={false}
                        onEvent='hover'
                        extraClassName='margin-left-5'
                    />
                </Menu.Item>
            }

            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.MODELS}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.MODELS)}
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
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.STATISTICAL_VALIDATION}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.STATISTICAL_VALIDATION)}
            >
                Statistical validations

                <InfoPopup
                    content={`Find target interactions with in miRNA external databases`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.PREDICT}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.PREDICT)}
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