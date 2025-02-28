import React, { useContext, useState } from 'react'
import { Dropdown, Menu, Image, Icon, Loader, Confirm } from 'semantic-ui-react'
import { DjangoUser } from '../utils/django_interfaces'
import { ConfirmModal, CustomAlert, CustomAlertTypes, Nullable } from '../utils/interfaces'
import { CurrentUserContext } from './Base'
import { UpdateUserModal } from './UpdateUserModal'
import { Alert } from './common/Alert'

// Constants declared in base.html
declare const urlIndex: string
declare const urlLogin: string
declare const urlLogout: string
declare const urlPipeline: string
declare const urlDatasets: string
// declare const urlSurvival: string
declare const urlBiomarkers: string
declare const urlInstitutions: string
declare const urlCGDSPanel: string
declare const urlAboutUs: string

/** Component's Props */
interface LogInLogOutPanelProps {
    currentUser: Nullable<DjangoUser>
}

/**
 * Renders an "Exit" button in case the user is logged in or a "Log in" button in case of an anonymous user
 * @param props Component's props
 * @returns Component
 */
const LogInLogOutPanel = (props: LogInLogOutPanelProps) => {
    const getDefaultConfirmModal = (): ConfirmModal => {
        return {
            confirmModal: false,
            headerText: '',
            contentText: '',
            onConfirm: () => console.log('DefaultConfirmModalFunction, this should change during cycle of component')
        }
    }

    /**
     * Generates a default alert structure
     * @returns Default alert.
     */
    const getDefaultAlertProps = (): CustomAlert => {
        return {
            message: '', // This have to change during cycle of component
            isOpen: false,
            type: CustomAlertTypes.SUCCESS,
            duration: 500
        }
    }

    const [modal, setModal] = useState({
        isOpen: false
    })
    const [alert, setAlert] = useState<CustomAlert>(getDefaultAlertProps)
    const [confirm, setConfirm] = useState<ConfirmModal>(getDefaultConfirmModal())

    /**
     * Reset the confirm modal, to be used again
     */
    const handleCancelConfirmModalState = () => {
        setConfirm(getDefaultConfirmModal())
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    const handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => {
        setConfirm(prevState => ({
            ...prevState,
            confirmModal: setOption,
            headerText,
            contentText,
            onConfirm
        }))
    }

    /**
     * Update Alert
     * @param isOpen flag to open or close alert.
     * @param type type of alert.
     * @param message message of alert.
     * @param callback Callback function if is needed.
     */
    const handleUpdateAlert = (isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<Function>) => {
        if (callback) {
            callback()
            setAlert(prevState => ({ ...prevState, isOpen, type, message }))
        } else {
            setAlert(prevState => ({ ...prevState, isOpen, type, message }))
        }
    }

    // In case it's loading the user, shows a placeholder
    if (props.currentUser === null) {
        return (
            <Menu.Item style={{ fontSize: '1rem' }}>
                <Icon name='spinner' loading />
            </Menu.Item>
        )
    }

    // Anonymous user
    if (props.currentUser.is_anonymous) {
        return (
            <Menu.Item as='a' href={urlLogin} style={{ fontSize: '1rem' }}>
                Log in
            </Menu.Item>
        )
    }

    // Logged user
    return (
        <>
            <Dropdown text={`Hi, ${props.currentUser.username}`} className='link item'>
                <Dropdown.Menu>
                    <Dropdown.Item icon='user' text='Edit profile' onClick={() => setModal({ ...modal, isOpen: true })} />
                    <Dropdown.Item icon='power off' text='Exit' as='a' href={urlLogout} />
                </Dropdown.Menu>
            </Dropdown>
            <UpdateUserModal isOpen={modal.isOpen} handleClose={() => setModal({ ...modal, isOpen: false })} currentUser={props.currentUser} handleChangeConfirmModalState={handleChangeConfirmModalState} handleUpdateAlert={handleUpdateAlert} />
            <Confirm
                open={confirm.confirmModal}
                header={confirm.headerText}
                content={confirm.contentText}
                size="large"
                onCancel={() => handleCancelConfirmModalState()}
                onConfirm={() => {
                    confirm.onConfirm()
                    setConfirm(prevState => ({ ...prevState, confirmModal: false }))
                }}
            />
            <Alert
                onClose={function (): void {
                    setAlert(prevState => ({ ...prevState, isOpen: false }))
                }}
                message={alert.message}
                isOpen={alert.isOpen}
                type={alert.type}
                duration={alert.duration}
            />
        </>
    )
}

type ActiveItemOptions = 'home' | 'pipeline' | 'files' | 'cgds' | 'survival' | 'institutions' | 'about-us' | 'biomarkers'

interface MainNavbarProps {
    activeItem?: ActiveItemOptions,
    isLoadingUser: boolean,
}

/**
 * Renders the main page Navbar
 * @param props Component's props
 * @returns Component
 */
const MainNavbar = (props: MainNavbarProps) => {
    // Gets current user context
    const currentUser = useContext(CurrentUserContext)

    const cBioPortalOption = (
        <Dropdown.Item
            text='cBioPortal'
            icon='cloud'
            as='a' href={urlCGDSPanel}
            active={props.activeItem === 'cgds'}
        />
    )

    return (
        <Menu className='margin-bottom-0' inverted borderless>
            {/* Logo */}
            <Menu.Item as='a' header href={urlIndex} title='Multiomix homepage'>
                <Image size='tiny' src='/static/frontend/img/logo.png' />
            </Menu.Item>

            {/* Loading spinners while user is fetch */}
            {props.isLoadingUser &&
                <Menu.Menu>
                    <Menu.Item style={{ padding: '0 1.72rem' }}>
                        <Loader active inline='centered' />
                    </Menu.Item>
                    <Menu.Item style={{ padding: '0 1.72rem' }}>
                        <Loader active inline='centered' />
                    </Menu.Item>
                    <Menu.Item style={{ padding: '0 1.7rem' }}>
                        <Loader active inline='centered' />
                    </Menu.Item>
                    <Menu.Item style={{ padding: '0 1.7rem' }}>
                        <Loader active inline='centered' />
                    </Menu.Item>
                </Menu.Menu>
            }
            {/* Analysis menu */}
            {currentUser && !currentUser.is_anonymous &&
                <React.Fragment>
                    <Menu.Menu as='h2'>
                        <Dropdown text='Analysis' className='link item' icon={null}>
                            <Dropdown.Menu>
                                {/* GEM panel */}
                                <Dropdown.Item
                                    text='GEM'
                                    icon='lab'
                                    title='Gene Expression Modulation'
                                    as='a' href={urlPipeline}
                                    active={props.activeItem === 'pipeline'}
                                />

                                {/* Survival Analysis panel */}
                                {/* TODO: discuss with team! Maybe this is the "Stats validation panel in Biomarkers page" */}
                                {/* <Dropdown.Item
                                    text='Survival'
                                    icon='heart'
                                    as='a' href={urlSurvival}
                                    active={props.activeItem === 'survival'}
                                    disabled
                                /> */}

                                {/* Biomarkers panel */}
                                <Dropdown.Item
                                    text='Biomarkers'
                                    icon='list layout'
                                    as='a' href={urlBiomarkers}
                                    active={props.activeItem === 'biomarkers'}
                                />
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Menu>

                    {/* Datasets menu */}
                    <Menu.Menu as='h2'>
                        <Dropdown text='Datasets' className='link item' icon={null}>
                            <Dropdown.Menu>
                                {/* User's Datasets panel */}
                                <Dropdown.Item
                                    text='Multiomix'
                                    icon='database'
                                    as='a' href={urlDatasets}
                                    active={props.activeItem === 'files'}
                                />

                                {/* cBioPortal Datasets panel */}
                                {cBioPortalOption}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Menu>
                </React.Fragment>
            }

            {/* Only admin options */}
            {currentUser && (currentUser.is_superuser || currentUser.is_institution_admin) &&
                <Menu.Menu as='h2'>
                    <Dropdown text='Admin' className='link item' icon={null}>
                        <Dropdown.Menu>
                            {currentUser.is_superuser &&
                                <React.Fragment>
                                    {/* User's Datasets panel */}
                                    <Dropdown.Item
                                        text='Database: Genes'
                                        icon='dna'
                                        // as='a' href={null}
                                        disabled
                                    />
                                </React.Fragment>
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            }

            {/* Institutions */}
            {currentUser &&
                <Menu.Menu as='h2'>
                    <Menu.Item as='a' href={urlInstitutions} style={{ fontSize: '1rem' }}>
                        Institutions
                    </Menu.Item>
                </Menu.Menu>

            }

            {/* About us */}
            <Menu.Menu as='h2'>
                <Menu.Item as='a' href={urlAboutUs} style={{ fontSize: '1rem' }}>
                    About us
                </Menu.Item>
            </Menu.Menu>

            {/* LogIn/LogOut panel */}
            <Menu.Menu as='h2' position='right'>
                <LogInLogOutPanel currentUser={currentUser} />
            </Menu.Menu>
        </Menu>
    )
}

export { MainNavbar, ActiveItemOptions }
