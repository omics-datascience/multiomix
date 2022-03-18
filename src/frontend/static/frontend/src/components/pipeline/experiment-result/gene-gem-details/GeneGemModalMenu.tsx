import React from 'react'
import { Menu } from 'semantic-ui-react'
import { Nullable } from '../../../../utils/interfaces'
import { ActiveItemMenu } from './GeneGemDetailsModal'
import { InfoPopup } from './InfoPopup'

/**
 * Component's props
 */
interface GeneGemModalMenuProps {
    gene: string,
    gem: string,
    /** Indicates if data is ordinal show correct tab titles */
    gemDataIsOrdinal: boolean,
    /** Indicates if it's a mRNA x miRNA experiment to show some extra options */
    isMiRNA: boolean,
    /** Description of correlation method */
    correlationMethodDescription: string,
    /** Description of p-values adjustment method */
    pValuesAdjustmentMethodDescription: string,
    /** Current active item */
    activeItem: Nullable<ActiveItemMenu>,
    /** Callback to change the active menu item */
    setActiveItem: (activeMenu: ActiveItemMenu) => void
}

/**
 * Renders the GeneGemDetailModal's menu
 * @param props Component's props
 * @returns Component
 */
export const GeneGemModalMenu = (props: GeneGemModalMenuProps) => {
    return (
        <Menu className='menu-with-bolder-border'>
            <Menu.Item
                active={props.activeItem === ActiveItemMenu.STATISTICAL_PROPERTIES}
                onClick={() => props.setActiveItem(ActiveItemMenu.STATISTICAL_PROPERTIES)}
            >
                Stats

                <InfoPopup
                    content={`Stats of the correlation and also of each value vector separately (${props.gene} and ${props.gem})`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.CORRELATION_GRAPH}
                onClick={() => props.setActiveItem(ActiveItemMenu.CORRELATION_GRAPH)}
            >
                Correlation {props.gemDataIsOrdinal ? 'boxplots' : 'graph'}

                <InfoPopup
                    content={`Correlation graph between ${props.gene} and ${props.gem} and also stats to measure the correlation`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            {props.isMiRNA &&
                <React.Fragment>
                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.MIRNA_TARGET_INTERACTION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.MIRNA_TARGET_INTERACTION)}
                    >
                        {props.gem}-{props.gene} Interaction

                        <InfoPopup
                            content={`Scores, given by external databases, that measures the association between ${props.gene} and ${props.gem} `}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.MIRNA_INTERACTION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.MIRNA_INTERACTION)}
                    >
                        {props.gem} Interaction

                        <InfoPopup
                            content={`Find target interactions with ${props.gem} in miRNA external databases`}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.DISEASES_ASSOCIATION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.DISEASES_ASSOCIATION)}
                    >
                        {props.gem} disease association

                        <InfoPopup
                            content={`Diseases associated with ${props.gem} in miRNA external databases`}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.DRUGS_ASSOCIATION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.DRUGS_ASSOCIATION)}
                    >
                        {props.gem} drug association

                        <InfoPopup
                            content={`Drugs associated with ${props.gem} in miRNA external databases`}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>
                </React.Fragment>
            }

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.ASSUMPTIONS}
                onClick={() => props.setActiveItem(ActiveItemMenu.ASSUMPTIONS)}
            >
                Assumptions

                <InfoPopup
                    content={`It evaluates the statistics assumptions that the data should satisfy for the correlation method (${props.correlationMethodDescription}) and the correction method (${props.pValuesAdjustmentMethodDescription}) used in this analysis`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.SURVIVAL_ANALYSIS}
                onClick={() => props.setActiveItem(ActiveItemMenu.SURVIVAL_ANALYSIS)}
            >
                Survival Analysis

                <InfoPopup
                    content={`Survival analysis between ${props.gene} low expression patient group and ${props.gene} high expression patient group`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>
        </Menu>
    )
}
