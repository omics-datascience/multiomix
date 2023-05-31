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
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerDetailsMenu = (props: BiomarkerDetailsMenuProps) => {
    return (
        <Menu className='menu-with-bolder-border margin-top-0'>
            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.MOLECULES}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.MOLECULES)}
            >
                Molecules details

                <InfoPopup
                    content='Details of the molecules that make up the Biomarker'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.MODELS}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.MODELS)}
            >
                Trained models

                <InfoPopup
                    content='Panel to list and train Machine Learning models from genomic and epigenomic information. These models will allow to statistically validate the prognostic/predictive power of the biomarker or to perform inference on new data'
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
                    content='Perform statistical validations from previously trained Machine Learning models'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveBiomarkerDetailItemMenu.INFERENCE}
                onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.INFERENCE)}
            >
                Inference

                <InfoPopup
                    content='Perform inference on new genomic and epigenomic data from previously trained Machine Learning models'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            {/* TODO: uncomment when confirmed this panel */}
            {/* {props.selectedBiomarker.has_fs_experiment &&
                <Menu.Item
                    active={props.activeItem === ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY}
                    onClick={() => props.setActiveItem(ActiveBiomarkerDetailItemMenu.FEATURE_SELECTION_SUMMARY)}
                >
                    Feature Selection summary

                    <InfoPopup
                        content='Feature Selection process details'
                        onTop={false}
                        onEvent='hover'
                        extraClassName='margin-left-5'
                    />
                </Menu.Item>
            } */}
        </Menu>
    )
}
