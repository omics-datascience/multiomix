import React from 'react'
import { Segment, Header, Icon, List } from 'semantic-ui-react'
import { DjangoTag } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'
import { TagForm } from '../common/TagForm'
import { useIntl } from 'react-intl'

/**
 * Component's props
 */
interface TagsPanelProps {
    newTag: DjangoTag,
    tags: DjangoTag[],
    selectedTag?: Nullable<DjangoTag>,
    addingTag: boolean,
    handleAddTagInputsChange: (name: string, value: any) => void
    handleKeyDown: (any) => void,
    confirmTagDeletion: (any) => void,
    editTag: (any) => void,
    handleFilterChanges?: (string, any) => void
}

/**
 * Renders a CRUD panel for Tags (model: api_service.models.Tag)
 * @param props Component's props
 * @returns Component
 */
export const TagsPanel = (props: TagsPanelProps) => {
    const intl = useIntl()
    const selectedTagId = props.selectedTag ? props.selectedTag.id : null
    const tagsItems = props.tags.map((tag) => {
        const isActive = tag.id === selectedTagId

        return (
            <List.Item
                key={tag.id as number}
                onDoubleClick={() => {
                    if (props.handleFilterChanges !== undefined) {
                        props.handleFilterChanges('tag', tag)
                    }
                }}
                className='clickable ellipsis'
            >
                <List.Content floated='right'>
                    {/* Edit button */}
                    <Icon
                        name='pencil'
                        color='yellow'
                        className='clickable'
                        title={intl.formatMessage({ id: 'tagsPanel.editTag' })}
                        onClick={() => props.editTag(tag)}
                    />

                    {/* Delete button */}
                    <Icon
                        name='trash'
                        color='red'
                        className='clickable'
                        title={intl.formatMessage({ id: 'tagsPanel.deleteTag' })}
                        onClick={() => props.confirmTagDeletion(tag)}
                    />
                </List.Content>
                <List.Icon
                    name={isActive ? 'filter' : 'tag'}
                    color={isActive ? 'green' : undefined}
                    title={isActive ? intl.formatMessage({ id: 'tagsPanel.filteredByTag' }) : ''}
                />
                <List.Content>
                    <List.Header>{tag.name}</List.Header>
                    <List.Description>{tag.description}</List.Description>
                </List.Content>
            </List.Item>
        )
    })

    return (
        <Segment>
            <Header textAlign='center'>
                <Icon name='tags' />
                <Header.Content>{intl.formatMessage({ id: 'tagsPanel.myTags' })}</Header.Content>
            </Header>

            {/* Add tag input */}
            <TagForm
                tag={props.newTag}
                disableInputs={props.addingTag}
                loading={props.addingTag}
                onHandleAddTagInputsChange={props.handleAddTagInputsChange}
                onHandleKeyDown={props.handleKeyDown}
            />

            {/* Tag List */}
            <List className='margin-top-5' divided relaxed verticalAlign='middle'>
                {tagsItems}
            </List>
        </Segment>
    )
}
