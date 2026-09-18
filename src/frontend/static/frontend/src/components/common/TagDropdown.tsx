import React, { useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { Button, Dropdown, Icon, Input, List, Loader } from 'semantic-ui-react'
import { DjangoTag, TagType } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'
import { alertGeneralError, copyObject, getDefaultNewTag, getDjangoHeader, getUserTagsByType } from '../../utils/util_functions'
import { TagForm } from './TagForm'

declare const urlTagsCRUD: string

/**
 * Component's props
 */
interface TagDropdownProps {
    /** Id of the Tag currently assigned. `null` if no Tag is assigned yet */
    selectedTagId: Nullable<number>,
    /**
     * Element on which the Dropdown is rendered when clicked. In a table it'll be the Tag
     * that's shown in the column, in a form it'll be a Button
     */
    trigger: React.ReactNode,
    /**
     * Type of Tag to fetch/create (Tags are different for Files and Experiments, see `TagType`).
     * If not specified, every Tag of the user is fetched
     */
    tagType?: TagType,
    /**
     * Executed when the user confirms a (possibly new) Tag selection by clicking "Save".
     * Receives `null` when the user clears the assigned Tag.
     * NOTE: this callback is not part of the two params described in the ticket, but it's needed
     * so the parent component (which owns the File/Experiment being tagged) can persist the change.
     * It's optional so the component still satisfies the original contract on its own.
     */
    onTagSelect?: (tagId: Nullable<number>) => void
    /**
     * Executed after a new Tag is successfully created from this Dropdown.
     * Lets parent components refresh their own Tag lists, such as table filters.
     */
    onTagCreated?: (newTag: DjangoTag) => void
    /**
     * Executed after an existing Tag is successfully edited from this Dropdown.
     * Lets parent components refresh their own Tag lists, such as table filters.
     */
    onTagEdited?: (editedTag: DjangoTag) => void
    /**
     * Executed after an existing Tag is successfully deleted from this Dropdown.
     * Lets parent components refresh their own Tag lists, such as table filters.
     */
    onTagDeleted?: (deletedTagId: number) => void
}

/**
 * Renders a Dropdown to select a Tag (with search) and to add a new one, replacing the old
 * Tag's CRUD UX (TagsPanel/ExperimentTagInfo/LastExperimentTagInfo).
 * @param props Component's props
 * @returns Component
 */
export const TagDropdown = (props: TagDropdownProps) => {
    const [open, setOpen] = useState<boolean>(false)
    const [view, setView] = useState<'list' | 'new'>('list')
    const [tags, setTags] = useState<DjangoTag[]>([])
    const [loadingTags, setLoadingTags] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [selectedId, setSelectedId] = useState<Nullable<number>>(props.selectedTagId)
    const [newTag, setNewTag] = useState<DjangoTag>(getDefaultNewTag())
    const [addingTag, setAddingTag] = useState<boolean>(false)
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 })

    const triggerRef = useRef<HTMLSpanElement>(null)
    const abortController = useRef(new AbortController())

    /** Fetches every Tag available for this TagType from the backend */
    const getTags = () => {
        setLoadingTags(true)

        getUserTagsByType(props.tagType, abortController.current.signal)
            .then((tagsResponse) => {
                setTags(tagsResponse)
            })
            .catch((err) => {
                if (!abortController.current.signal.aborted) {
                    console.log('Error getting Tags ->', err)
                }
            })
            .finally(() => setLoadingTags(false))
    }

    /** Fetches all the Tags as soon as the component is mounted. */
    useEffect(() => {
        getTags()

        return () => abortController.current.abort()
    }, [])

    /** Discards any unsaved "New tag" draft when the panel is closed */
    const handleClose = () => {
        setOpen(false)
        setView('list')
        setNewTag(getDefaultNewTag())
    }

    /**
     * Keeps the internal selection in sync if the parent updates the Tag from outside
     * while the panel is closed (e.g. after a refresh of the underlying data).
     */
    useEffect(() => {
        if (!open) {
            setSelectedId(props.selectedTagId)
        }
    }, [open, props.selectedTagId])

    /** Resets the panel's internal state every time it's opened */
    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setMenuPosition({ top: rect.bottom, left: rect.left })
        }

        setSelectedId(props.selectedTagId)
        setSearchTerm('')
        setView('list')
        setOpen(true)
    }

    /**
     * Confirms the current selection and closes the panel.
     * @param e Click event from the Save button.
     */
    const handleSave = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault()
        e?.stopPropagation()

        if (props.onTagSelect) {
            props.onTagSelect(selectedId)
        }

        handleClose()
    }

    /**
     * Discards any pending change made during this opening of the Dropdown.
     */
    const handleResetSelection = () => {
        setSelectedId(props.selectedTagId)
    }

    /**
     * Handles changes for the "New tag" form fields (name/description)
     * @param name Field name to update.
     * @param value New field value.
     */
    const handleNewTagInputsChange = (name: string, value: any) => {
        setNewTag((prevNewTag) => ({ ...prevNewTag, [name]: value }))
    }

    /**
     * Goes back to the Tags list discarding the current "New tag" draft.
     */
    const goBackToList = () => {
        setNewTag(getDefaultNewTag())
        setView('list')
    }

    /**
     * Submits the "New tag" form on Enter, cancels it on Escape
     * @param e Keyboard event from the Tag form.
     */
    const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()

        if (e.key === 'Enter') {
            createTag()
        } else if (e.key === 'Escape') {
            goBackToList()
        }
    }

    /**
     * Opens the Tag form with the selected Tag's data.
     * @param e Click event from the edit icon.
     * @param tag Tag to edit.
     */
    const editTag = (e: React.MouseEvent<HTMLElement>, tag: DjangoTag) => {
        e.preventDefault()
        e.stopPropagation()
        setNewTag(copyObject(tag))
        setView('new')
    }

    /**
     * Deletes a Tag and removes it from the local list.
     * @param e Click event from the delete icon.
     * @param tag Tag to delete.
     */
    const deleteTag = (e: React.MouseEvent<HTMLElement>, tag: DjangoTag) => {
        // Keeps the icon click from selecting the row or closing the Semantic UI Dropdown.
        e.preventDefault()
        e.stopPropagation()

        if (!tag.id) {
            return
        }

        ky.delete(`${urlTagsCRUD}${tag.id}/`, { headers: getDjangoHeader() })
            .then(() => {
                setTags((prevTags) => prevTags.filter((currentTag) => currentTag.id !== tag.id))

                if (selectedId === tag.id) {
                    setSelectedId(null)
                }

                if (props.onTagDeleted) {
                    props.onTagDeleted(tag.id as number)
                }
            })
            .catch((err) => {
                alertGeneralError()
                console.log('Error deleting Tag ->', err)
            })
    }

    /**
     * Sends the request to create or update a Tag and selects it as soon as it's saved.
     */
    const createTag = () => {
        console.log('Creating tag with data ->', newTag)

        if (addingTag || !newTag.name.trim()) {
            return
        }

        const tagToCreate: DjangoTag = { ...newTag, type: props.tagType ?? newTag.type }
        const isEditing = newTag.id !== null
        const request = isEditing
            ? ky.patch(`${urlTagsCRUD}${newTag.id}/`, { headers: getDjangoHeader(), json: tagToCreate })
            : ky.post(urlTagsCRUD, { headers: getDjangoHeader(), json: tagToCreate })

        setAddingTag(true)

        request
            .then((response) => {
                response.json<DjangoTag>().then((savedTag) => {
                    if (savedTag && savedTag.id) {
                        setTags((prevTags) => {
                            if (isEditing) {
                                return prevTags.map((currentTag) => currentTag.id === savedTag.id ? savedTag : currentTag)
                            }

                            return [...prevTags, savedTag]
                        })
                        setSelectedId(savedTag.id)
                        setNewTag(getDefaultNewTag())
                        setView('list')

                        if (isEditing && props.onTagEdited) {
                            props.onTagEdited(savedTag)
                        } else if (!isEditing && props.onTagCreated) {
                            props.onTagCreated(savedTag)
                        }
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing the saved Tag JSON ->', err)
                })
            })
            .catch((err) => {
                alertGeneralError()
                console.log('Error saving Tag ->', err)
            })
            .finally(() => setAddingTag(false))
    }

    const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const hasPendingChanges = selectedId !== props.selectedTagId
    const dropdownMenuStyle = {
        position: 'fixed' as const,
        top: menuPosition.top,
        left: menuPosition.left,
        width: 320,
        maxWidth: 320,
        zIndex: 9999
    }

    /**
     * Handles key presses inside the list search input.
     * @param e Keyboard event from the search input.
     */
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation()

        if (e.key === 'Enter') {
            handleSave()
        }
    }

    /**
     * Handles keyboard shortcuts bubbling to the menu.
     * @param e Keyboard event from the menu.
     */
    const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Tab') {
            e.stopPropagation()

            return
        }

        if (e.key !== 'Enter') {
            e.stopPropagation()

            return
        }

        e.stopPropagation()

        if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') {
            return
        }

        if (view === 'list') {
            handleSave()
        } else {
            createTag()
        }
    }

    /**
     * Renders the "Tags" list/search view.
     * @returns Tags list/search view.
     */
    const renderTagsListView = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 0' }}>
                <strong>Tags</strong>

                <span className='clickable' style={{ color: '#2185d0' }} onClick={() => setView('new')}>
                    <Icon name='add' />New tag
                </span>
            </div>

            <div style={{ padding: '10px 14px 0' }}>
                <Input
                    fluid
                    icon='search'
                    placeholder='Search tag'
                    value={searchTerm}
                    onChange={(_e, { value }) => setSearchTerm(value)}
                    onKeyDown={handleSearchKeyDown}
                />
            </div>

            <div style={{ maxHeight: 250, overflowY: 'auto', padding: '6px 14px' }}>
                {loadingTags && tags.length === 0
                    ? <Loader active inline='centered' className='margin-top-2' />
                    : (
                        <List selection verticalAlign='middle'>
                            <List.Item
                                className='clickable'
                                active={selectedId === null}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedId(null)
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                    <Icon
                                        name={selectedId === null ? 'check' : 'tag'}
                                        color={selectedId === null ? 'green' : undefined}
                                        style={{ margin: 0 }}
                                    />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        No tag
                                    </span>
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} />
                                </div>
                            </List.Item>

                            {filteredTags.map((tag) => {
                                const isSelected = tag.id === selectedId
                                console.log('Rendering tag ->', tag, 'isSelected ->', isSelected)
                                return (
                                    <List.Item
                                        key={tag.id as number}
                                        className='clickable'
                                        active={isSelected}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedId(tag.id)
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                            <Icon
                                                name={isSelected ? 'check' : 'tag'}
                                                color={isSelected ? 'green' : undefined}
                                                style={{ margin: 0 }}
                                            />
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {tag.name}
                                            </span>
                                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                <Icon
                                                    name='pencil'
                                                    color='blue'
                                                    className='clickable'
                                                    title='Edit tag'
                                                    onClick={(e) => editTag(e, tag)}
                                                />
                                                <Icon
                                                    name='trash'
                                                    color='red'
                                                    className='clickable'
                                                    title='Delete tag'
                                                    onClick={(e) => deleteTag(e, tag)}
                                                />
                                            </div>
                                        </div>
                                    </List.Item>
                                )
                            })}

                            {(!loadingTags && filteredTags.length === 0) &&
                                <List.Item className='align-center'>No Tags found</List.Item>}
                        </List>
                    )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 14px', borderTop: '1px solid rgba(34,36,38,.1)' }}>
                <Button basic disabled={!hasPendingChanges} onClick={handleResetSelection}>Reset</Button>
                <Button
                    primary
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSave()
                    }}
                >
                    Save
                </Button>
            </div>
        </>
    )

    /**
     * Renders the "New tag" form view.
     * @returns New Tag form view.
     */
    const newTagView = (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 0' }}>
                <strong>{newTag.id === null ? 'New tag' : 'Edit tag'}</strong>
                <Icon name='arrow left' className='clickable' onClick={goBackToList} title='Back to Tags' />
            </div>

            <div style={{ padding: '10px 14px' }}>
                <TagForm
                    tag={newTag}
                    disableInputs={addingTag}
                    loading={addingTag}
                    onHandleAddTagInputsChange={handleNewTagInputsChange}
                    onHandleKeyDown={handleNewTagKeyDown}
                    tabIndexStart={1}
                />
            </div>

            <div style={{ padding: '0 14px 10px' }}>
                <Button
                    primary
                    fluid
                    loading={addingTag}
                    disabled={addingTag || !newTag.name.trim()}
                    onClick={createTag}
                >
                    {newTag.id === null ? 'Create' : 'Save changes'}
                </Button>
            </div>
        </>
    )

    return (
        <Dropdown
            trigger={<span ref={triggerRef}>{props.trigger}</span>}
            icon={null}
            open={open}
            closeOnBlur
            onOpen={handleOpen}
            onClose={handleClose}
            onKeyDown={(e) => {
                if (e.key === 'Tab') {
                    e.stopPropagation()
                }
            }}
            className='tag-dropdown'
        >
            <Dropdown.Menu
                style={dropdownMenuStyle}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleMenuKeyDown}
            >
                {view === 'list' ? renderTagsListView() : newTagView}
            </Dropdown.Menu>
        </Dropdown>
    )
}
