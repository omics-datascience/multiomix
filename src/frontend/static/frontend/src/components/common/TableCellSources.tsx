import React from 'react'
import { SourcePopup } from '../pipeline/all-experiments-view/SourcePopup'
import { DjangoExperimentSource } from '../../utils/django_interfaces'
import { GenesColors, Nullable } from '../../utils/interfaces'
import { useIntl } from 'react-intl'

/**
 * Component to show sourcePopups if files provides
 * @returns component
 */
interface Props {
    clinical_source: Nullable<DjangoExperimentSource>,
    methylation_source: Nullable<DjangoExperimentSource>,
    mrna_source: Nullable<DjangoExperimentSource>,
    cna_source: Nullable<DjangoExperimentSource>,
    mirna_source: Nullable<DjangoExperimentSource>,
}

export const TableCellSources = (props: Props) => {
    const intl = useIntl()
    return (
        <>
            {
                /* Download clinical file */
                props.clinical_source && (
                    <SourcePopup
                        source={props.clinical_source}
                        iconName='file'
                        iconColor={GenesColors.CLINICAL}
                        downloadButtonTitle={intl.formatMessage({ id: 'tableCellSources.downloadClinical' })}
                    />
                )
            }
            {
                /* Download mRna file */
                props.mrna_source && (
                    <SourcePopup
                        source={props.mrna_source}
                        iconName='file alternate'
                        iconColor={GenesColors.MRNA}
                        downloadButtonTitle={intl.formatMessage({ id: 'tableCellSources.downloadMrna' })}
                    />
                )
            }
            {
                /* Download mirna file */
                props.mirna_source && (
                    <SourcePopup
                        source={props.mirna_source}
                        iconName='file alternate'
                        iconColor={GenesColors.MIRNA}
                        downloadButtonTitle={intl.formatMessage({ id: 'tableCellSources.downloadMirna' })}
                    />
                )
            }
            {
                /* Download cna file */
                props.cna_source && (
                    <SourcePopup
                        source={props.cna_source}
                        iconName='file alternate'
                        iconColor={GenesColors.CNA}
                        downloadButtonTitle={intl.formatMessage({ id: 'tableCellSources.downloadCna' })}
                    />
                )
            }
            {
                /* Download methylation file */
                props.methylation_source && (
                    <SourcePopup
                        source={props.methylation_source}
                        iconName='file alternate'
                        iconColor={GenesColors.METHYLATION}
                        downloadButtonTitle={intl.formatMessage({ id: 'tableCellSources.downloadMethylation' })}
                    />
                )
            }
        </>
    )
}
