import React from 'react'
import { Menu } from 'semantic-ui-react'
import { Nullable } from '../../../../utils/interfaces'
import { ActiveItemMenu } from './GeneGemDetailsModal'
import { InfoPopup } from './InfoPopup'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    return (
        <Menu className='menu-with-bolder-border'>
            <Menu.Item
                active={props.activeItem === ActiveItemMenu.STATISTICAL_PROPERTIES}
                onClick={() => props.setActiveItem(ActiveItemMenu.STATISTICAL_PROPERTIES)}
            >
                {intl.formatMessage({ id: 'geneGemModalMenu.stats' })}

                <InfoPopup
                    content={intl.formatMessage(
                        { id: 'geneGemModalMenu.stats.info' },
                        { gene: props.gene, gem: props.gem }
                    )}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.CORRELATION_GRAPH}
                onClick={() => props.setActiveItem(ActiveItemMenu.CORRELATION_GRAPH)}
            >
                {intl.formatMessage({
                    id: props.gemDataIsOrdinal
                        ? 'geneGemModalMenu.correlationBoxplots'
                        : 'geneGemModalMenu.correlationGraph'
                })}

                <InfoPopup
                    content={intl.formatMessage(
                        { id: 'geneGemModalMenu.correlation.info' },
                        { gene: props.gene, gem: props.gem }
                    )}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            {props.isMiRNA && (
                <>
                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.MIRNA_TARGET_INTERACTION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.MIRNA_TARGET_INTERACTION)}
                    >
                        {intl.formatMessage({ id: 'geneGemModalMenu.mirnaInteraction' }, { gem: props.gem, gene: props.gene })}

                        <InfoPopup
                            content={intl.formatMessage(
                                { id: 'geneGemModalMenu.interaction.info' },
                                { gene: props.gene, gem: props.gem }
                            )}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.MIRNA_INTERACTION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.MIRNA_INTERACTION)}
                    >
                        {intl.formatMessage(
                            { id: 'geneGemModalMenu.mirnaInteraction' },
                            { gem: props.gem }
                        )}

                        <InfoPopup
                            content={intl.formatMessage(
                                { id: 'geneGemModalMenu.mirnaInteraction.info' },
                                { gem: props.gem }
                            )}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.DISEASES_ASSOCIATION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.DISEASES_ASSOCIATION)}
                    >
                        {intl.formatMessage(
                            { id: 'geneGemModalMenu.diseaseAssociation' },
                            { gem: props.gem }
                        )}

                        <InfoPopup
                            content={intl.formatMessage(
                                { id: 'geneGemModalMenu.diseaseAssociation.info' },
                                { gem: props.gem }
                            )}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveItemMenu.DRUGS_ASSOCIATION}
                        onClick={() => props.setActiveItem(ActiveItemMenu.DRUGS_ASSOCIATION)}
                    >
                        {intl.formatMessage(
                            { id: 'geneGemModalMenu.drugAssociation' },
                            { gem: props.gem }
                        )}

                        <InfoPopup
                            content={intl.formatMessage(
                                { id: 'geneGemModalMenu.drugAssociation.info' },
                                { gem: props.gem }
                            )}
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>
                </>
            )}

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.ASSUMPTIONS}
                onClick={() => props.setActiveItem(ActiveItemMenu.ASSUMPTIONS)}
            >
                {intl.formatMessage({ id: 'geneGemModalMenu.assumptions' })}

                <InfoPopup
                    content={intl.formatMessage(
                        { id: 'geneGemModalMenu.assumptions.info' },
                        {
                            correlationMethod: props.correlationMethodDescription,
                            correctionMethod: props.pValuesAdjustmentMethodDescription
                        }
                    )}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            <Menu.Item
                active={props.activeItem === ActiveItemMenu.SURVIVAL_ANALYSIS}
                onClick={() => props.setActiveItem(ActiveItemMenu.SURVIVAL_ANALYSIS)}
            >
                {intl.formatMessage({ id: 'geneGemModalMenu.survivalAnalysis' })}

                <InfoPopup
                    content={intl.formatMessage(
                        { id: 'geneGemModalMenu.survivalAnalysis.info' },
                        { gene: props.gene }
                    )}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>
        </Menu>
    )
}
