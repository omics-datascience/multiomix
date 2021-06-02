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
    /** True to show a form with survival tuples from left to right. False to make the form vertical */
    inline?: boolean,
    /** Callback to edit a Survival tuple, only needed when showSurvivalTuplesForm is true */
    handleSurvivalFormDatasetChanges: (idx: number, name: string, value) => void,
    addSurvivalFormTuple: () => void,
    removeSurvivalFormTuple: (idx: number) => void
}

const BaseContainerInline = (props: {children: JSX.Element}) => {
    return (
        <Grid>
            <Grid.Row>
                {props.children}
            </Grid.Row>
        </Grid>
    )
}

const ContainerInline = (props: { children: JSX.Element, className?: string }) => {
    return (
        <Grid.Column width={3} className={props.className}>
            {props.children}
        </Grid.Column>
    )
}

const BaseContainerNoInline = (props: {children: JSX.Element}) => {
    return (
        <Grid>
            {props.children}
        </Grid>
    )
}

const ContainerNoInline = (props: { children: JSX.Element, className?: string }) => {
    return (
        <Grid.Row columns={1} className={props.className}>
            <Grid.Column>
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

    const BaseContainer = props.inline ? BaseContainerInline : BaseContainerNoInline
    const Container = props.inline ? ContainerInline : ContainerNoInline

    return (
        <React.Fragment>
            <BaseContainer>
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
                            <Container key={idx} className={props.inline ? 'margin-top-2' : ''}>
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
                            </Container>
                        )
                    })}
                </React.Fragment>
            </BaseContainer>

            <Grid>
                <Grid.Row>
                    <Grid.Column>
                        <Button
                            // Fluid only when is not inline to prevent extremely wide button
                            fluid={!props.inline}
                            color='blue'
                            className={!props.inline ? 'margin-top-5' : ''}
                            onClick={() => addSurvivalFormTuple()}
                            disabled={!lastSurvivalTupleIsValid() || props.disabled}
                        >
                            <Icon name='plus' />

                            Add survival tuple
                        </Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </React.Fragment >
    )
}
