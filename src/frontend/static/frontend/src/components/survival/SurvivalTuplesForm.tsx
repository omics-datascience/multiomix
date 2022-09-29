import React from 'react'
import { Button, Grid, Header, Icon, Input, Segment } from 'semantic-ui-react'
import { DjangoSurvivalColumnsTupleSimple } from '../../utils/django_interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'
import { survivalTupleIsValid } from './utils'

/**
 * Component's props
 */
interface SurvivalTuplesFormProps {
    /** List of survival tuples to show in form */
    survivalColumns: DjangoSurvivalColumnsTupleSimple[],
    /** True to show loading icons in inputs */
    loading?: boolean,
    /** True to disable the entire form */
    disabled?: boolean,
    /**  True to remove padding on left and right */
    noPadding?: boolean,
    /** Callback to edit a Survival tuple, only needed when showSurvivalTuplesForm is true */
    handleSurvivalFormDatasetChanges: (idx: number, name: string, value) => void,
    addSurvivalFormTuple: () => void,
    removeSurvivalFormTuple: (idx: number) => void
}

const ContainerNoInline = (props: { children: JSX.Element, noPadding?: boolean }) => {
    const classPadding = props.noPadding ? 'no-padding' : ''

    return (
        <Grid.Row columns={1}>
            <Grid.Column className={classPadding}>
                {props.children}
            </Grid.Column>
        </Grid.Row>
    )
}

/**
 * Renders a form to add multiples survival tuples
 * @param props Component's props
 * @returns Component
 */
export const SurvivalTuplesForm = (props: SurvivalTuplesFormProps) => {
    /**
     * Checks if last Survival tuple is valid to allow user to create another one
     * @returns True if user can add another survival tuple, false otherwise
     */
    function lastSurvivalTupleIsValid (): boolean {
        const survivalTuples = props.survivalColumns
        if (!survivalTuples || !survivalTuples.length) {
            return true
        }

        const lastTuple = survivalTuples[survivalTuples.length - 1]
        return survivalTupleIsValid(lastTuple)
    }

    const addSurvivalFormTuple = props.addSurvivalFormTuple

    return (
        <React.Fragment>
            <React.Fragment>
                {props.survivalColumns?.map((survivalColumn, idx) => {
                    const checkedHandleSurvivalFormChanges = checkedValidityCallback(
                        (name, value) => {
                            const callback = props.handleSurvivalFormDatasetChanges
                            return callback(idx, name, value)
                        }
                    )

                    const removeSurvivalFormTuple = props.removeSurvivalFormTuple
                    return (
                        <ContainerNoInline key={idx} noPadding={props.noPadding}>
                            <Segment>
                                <Header as='h4'>
                                    Survival tuple #{idx + 1}

                                    <Icon
                                        name='trash'
                                        color='red'
                                        className='clickable pull-right'
                                        title='Remove this survival tuple'
                                        disabled={props.disabled}
                                        onClick={() => removeSurvivalFormTuple(idx)}
                                    />
                                </Header>
                                <Input
                                    icon='asterisk'
                                    fluid
                                    name='event_column'
                                    className="margin-top-2"
                                    value={survivalColumn.event_column}
                                    onChange={checkedHandleSurvivalFormChanges}
                                    loading={props.loading}
                                    disabled={props.disabled}
                                    placeholder='Column of event'
                                    maxLength={30}
                                />

                                <Input
                                    icon='asterisk'
                                    fluid
                                    name='time_column'
                                    className="margin-top-2"
                                    value={survivalColumn.time_column}
                                    onChange={checkedHandleSurvivalFormChanges}
                                    loading={props.loading}
                                    disabled={props.disabled}
                                    placeholder='Column of time'
                                    maxLength={30}
                                />
                            </Segment>
                        </ContainerNoInline>
                    )
                })}
            </React.Fragment>

            <Grid.Row>
                <Grid.Column className={props.noPadding ? 'no-padding' : ''}>
                    <Button
                        // Fluid only when is not inline to prevent extremely wide button
                        fluid
                        color='blue'
                        className='margin-top-5'
                        onClick={() => addSurvivalFormTuple()}
                        disabled={!lastSurvivalTupleIsValid() || props.disabled}
                    >
                        <Icon name='plus' />

                        Add survival tuple
                    </Button>
                </Grid.Column>
            </Grid.Row>
        </React.Fragment >
    )
}
