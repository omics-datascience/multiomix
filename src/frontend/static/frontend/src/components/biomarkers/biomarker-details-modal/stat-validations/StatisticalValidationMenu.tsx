import React from 'react'
import { Menu } from 'semantic-ui-react'
import { StatisticalValidationForTable, ActiveStatValidationsItemMenu } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'

/** StatisticalValidationMenu props. */
interface StatisticalValidationMenuProps {
    /** Selected StatisticalValidationForTable instance to show the options. */
    selectedStatisticalValidation: StatisticalValidationForTable,
    /** Getter of the active item in the menu. */
    activeItem: ActiveStatValidationsItemMenu,
    /** Setter of the active item in the menu. */
    setActiveItem: (activeItem: ActiveStatValidationsItemMenu) => void,
}

/**
 * Renders the menu for the modal of Biomarker's statistical validations.
 * @param props Component props.
 * @returns Component.
 */
export const StatisticalValidationMenu = (props: StatisticalValidationMenuProps) => {
    return (
        <Menu className='menu-with-bolder-border margin-top-0'>
            <Menu.Item
                active={props.activeItem === ActiveStatValidationsItemMenu.BEST_FEATURES}
                onClick={() => props.setActiveItem(ActiveStatValidationsItemMenu.BEST_FEATURES)}
            >
                Most significant features

                <InfoPopup
                    content='Most significant features for the survival analysis'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveStatValidationsItemMenu.KAPLAN_MEIER}
                onClick={() => props.setActiveItem(ActiveStatValidationsItemMenu.KAPLAN_MEIER)}
            >
                Kaplan-Meier

                <InfoPopup
                    content='Kaplan-Meier curve showing survival or hazard ratio'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveStatValidationsItemMenu.HEATMAP}
                onClick={() => props.setActiveItem(ActiveStatValidationsItemMenu.HEATMAP)}
            >
                Heatmap

                <InfoPopup
                    content='Heatmap for every sample and molecule'
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>
        </Menu>
    )
}
