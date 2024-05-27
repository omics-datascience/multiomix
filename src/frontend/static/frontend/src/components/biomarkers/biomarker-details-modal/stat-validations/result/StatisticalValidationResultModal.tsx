
import React, { useState } from 'react'
import { ActiveStatValidationsItemMenu, StatisticalValidationForTable } from '../../../types'
import { StatisticalValidationMenu } from '../StatisticalValidationMenu'
import { StatisticalValidationResultMetrics } from './StatisticalValidationResultMetrics'
import { Grid, Segment } from 'semantic-ui-react'
import { StatisticalValidationResultBestFeatures } from './StatisticalValidationResultBestFeatures'
import { StatisticalValidationResultHeatMap } from './StatisticalValidationResultHeatMap'
import { StatisticalValidationResultKaplanMeier } from './StatisticalValidationResultKaplanMeier'

/** BiomarkerNewStatisticalValidationModal props. */
interface StatisticalValidationResultModalProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable
}

/**
 * Renders a panel to show all the StatisticalValidation data.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultModal = (props: StatisticalValidationResultModalProps) => {
    const [activeItem, setActiveItem] = useState<ActiveStatValidationsItemMenu>(ActiveStatValidationsItemMenu.BEST_FEATURES)

    /**
     * Gets the selected component according to the active item.
     * @returns The corresponding component
     */
    function getSelectedComponent (): JSX.Element {
        switch (activeItem) {
            case ActiveStatValidationsItemMenu.BEST_FEATURES:
                return <StatisticalValidationResultBestFeatures selectedStatisticalValidation={props.selectedStatisticalValidation} />

            case ActiveStatValidationsItemMenu.KAPLAN_MEIER: {
                return <StatisticalValidationResultKaplanMeier selectedStatisticalValidation={props.selectedStatisticalValidation} />
            }

            case ActiveStatValidationsItemMenu.HEATMAP:
                return <StatisticalValidationResultHeatMap selectedStatisticalValidation={props.selectedStatisticalValidation} />
        }
    }

    return (
        <>
            <Grid>
                <Grid.Row columns={2} stretched>
                    <Grid.Column width={4}>
                        <Segment>
                            <StatisticalValidationResultMetrics selectedStatisticalValidation={props.selectedStatisticalValidation} />
                        </Segment>
                    </Grid.Column>
                    <Grid.Column width={12} textAlign='center'>
                        <Segment>
                            {/* Menu */}
                            <StatisticalValidationMenu
                                activeItem={activeItem}
                                setActiveItem={setActiveItem}
                                selectedStatisticalValidation={props.selectedStatisticalValidation}
                            />

                            {/* Selected menu option */}
                            {getSelectedComponent()}
                        </Segment>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    )
}
