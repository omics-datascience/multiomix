import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { Card, Placeholder } from 'semantic-ui-react'
import { Nullable } from '../../../../../utils/interfaces'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { StatisticalValidationForTable, StatValidationKaplanMeier } from '../../../types'

declare const urlStatisticalValidationHeatMap: string

/** StatisticalValidationResultKaplanMeier props. */
interface StatisticalValidationResultKaplanMeierProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with a HeatMap to visualize all the samples and their expressions for all the molecules of a Biomarker.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultKaplanMeier = (props: StatisticalValidationResultKaplanMeierProps) => {
    const [loading, setLoading] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<StatValidationKaplanMeier>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationBestFeatures()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationBestFeatures = () => {
        setLoading(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationHeatMap, { searchParams }).then((response) => {
            response.json().then((statValidation: StatValidationKaplanMeier) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation best features', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <>
            {/* TODO: refactor this Placeholder as is the same for HeatMap and BestFeatures */}
            {loading &&
                <Card>
                    <Placeholder>
                        <Placeholder.Image square />
                    </Placeholder>

                    <Card.Content>
                        <Placeholder>
                            <Placeholder.Header>
                                <Placeholder.Line length='very short' />
                                <Placeholder.Line length='medium' />
                            </Placeholder.Header>
                            <Placeholder.Paragraph>
                                <Placeholder.Line length='short' />
                            </Placeholder.Paragraph>
                        </Placeholder>
                    </Card.Content>
                </Card>
            }

            {/* TODO: If this align-center div is used in all the results panels, refactor! */}
            {(!loading && statValidationData !== null) &&
                <div className='align-center margin-top-5'>
                </div>
            }
        </>
    )
}
