import React, { useMemo } from 'react'
import { Button, Grid, Header, Icon, Input, Segment, Select } from 'semantic-ui-react'
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
    /** posibles values for survival tuple if undefined allows the users to write their own text */
    survivalTuplesPossiblesValues?: string[],
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

    /**
     * method to handle select change.
     * @param idx id of tuple.
     * @param name name of field.
     * @param value value.
     */
    const handleChangeValueTuple = (idx: number, name: string, value: any) => {
        props.handleSurvivalFormDatasetChanges(idx, name, value)
    }

    /**
     * Value memorize to handle array of string to Selector data model.
     * Initial if to handle if value is an array or a undefined, undefined is declared to handle if it will be a input or a selector.
     * Selector is when an string array is passed by props.
     * Input is when undefined is passed by props.
     */
    const posiblesValues = useMemo(() => props.survivalTuplesPossiblesValues === undefined ? undefined : props.survivalTuplesPossiblesValues.map(item => ({ key: item, value: item, text: item })), [props.survivalTuplesPossiblesValues])

    return (
        <React.Fragment>
            <React.Fragment>
                {props.survivalColumns?.map((survivalColumn, idx) => {
                    const checkedHandleSurvivalFormChanges = checkedValidityCallback(
                        (name, value) => {
                            console.log(name, value)
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
                                {
                                    posiblesValues === undefined
                                        ? (
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
                                        )
                                        : (
                                            <Select
                                                placeholder='Column of event'
                                                name='event_column'
                                                fluid
                                                className="margin-top-2"
                                                loading={props.loading}
                                                disabled={props.disabled}
                                                options={posiblesValues.filter(value => value.key !== survivalColumn.time_column)}
                                                value={survivalColumn.event_column}
                                                onChange={(_, { name, value }) => handleChangeValueTuple(idx, name, value)}
                                            />
                                        )
                                }
                                {
                                    posiblesValues === undefined
                                        ? (
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
                                        )
                                        : (
                                            <Select
                                                options={posiblesValues.filter(value => value.key !== survivalColumn.event_column)}
                                                fluid
                                                name='time_column'
                                                className="margin-top-2"
                                                value={survivalColumn.time_column}
                                                loading={props.loading}
                                                disabled={props.disabled}
                                                placeholder='Column of time'
                                                onChange={(_, { name, value }) => handleChangeValueTuple(idx, name, value)}
                                            />
                                        )
                                }
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
        </React.Fragment>
    )
}
