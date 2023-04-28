
import React, { useState } from 'react'
import { ActiveStatValidationsItemMenu, StatisticalValidationForTable } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import { BiomarkerStatisticalValidationMenu } from './BiomarkerStatisticalValidationMenu'
import { BiomarkerStatisticalValidationResultMetrics } from './BiomarkerStatisticalValidationResultMetrics'
import { Grid, Segment } from 'semantic-ui-react'

/** BiomarkerNewStatisticalValidationModal props. */
interface BiomarkerStatisticalValidationResultModalProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable
}

/**
 * Renders a panel to show all the StatisticalValidation data.
 * @param props Component's props
 * @returns Component
 */
export const BiomarkerStatisticalValidationResultModal = (props: BiomarkerStatisticalValidationResultModalProps) => {
    const [activeItem, setActiveItem] = useState<ActiveStatValidationsItemMenu>(ActiveStatValidationsItemMenu.BEST_FEATURES)

    /**
     * Gets the selected component according to the active item.
     * @returns The corresponding component
     */
    function getSelectedComponent (): Nullable<JSX.Element> {
        if (!props.selectedStatisticalValidation) {
            return null
        }

        switch (activeItem) {
            default:
                return null // TODO: remove this and change the function return type
        }
    }

    return (
        <>
            <Grid>
                <Grid.Row columns={2} stretched>
                    <Grid.Column width={4}>
                        <Segment>
                            <BiomarkerStatisticalValidationResultMetrics selectedStatisticalValidation={props.selectedStatisticalValidation} />
                        </Segment>
                    </Grid.Column>
                    <Grid.Column width={8}>
                        <Segment>
                            {/* Menu */}
                            <BiomarkerStatisticalValidationMenu
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
