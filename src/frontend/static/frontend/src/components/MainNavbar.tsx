import React, { useContext, useState } from 'react'
import { Dropdown, Menu, Image, Icon, Loader, Confirm } from 'semantic-ui-react'
import { DjangoUser } from '../utils/django_interfaces'
import { ConfirmModal, CustomAlert, CustomAlertTypes, Nullable } from '../utils/interfaces'
import { CurrentUserContext } from './Base'
import { UpdateUserModal } from './UpdateUserModal'
import { Alert } from './common/Alert'
import { useIntl } from 'react-intl'

// Constants declared in base.html
declare const urlIndex: string
declare const urlLogin: string
declare const urlLogout: string
declare const urlPipeline: string
declare const urlDatasets: string
declare const urlBiomarkers: string
declare const urlInstitutions: string
declare const urlCGDSPanel: string
declare const urlAboutUs: string
declare const urlOpenSource: string
declare const urlDifferentialExpression: string

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
    const intl = useIntl()

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
    const handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => {
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
    const handleUpdateAlert = (isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>) => {
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
                {intl.formatMessage({ id: 'mainNavbar.login' })}
            </Menu.Item>
        )
    }

    // Logged user
    return (
        <>
            <Dropdown text={intl.formatMessage({ id: 'mainNavbar.greeting' }, { username: props.currentUser.username })} className='link item' aria-label='Login/Logout'>
                <Dropdown.Menu>
                    <Dropdown.Item icon='user' text={intl.formatMessage({ id: 'mainNavbar.editProfile' })} onClick={() => setModal({ ...modal, isOpen: true })} />
                    <Dropdown.Item icon='power off' text={intl.formatMessage({ id: 'mainNavbar.exit' })} as='a' href={urlLogout} />
                </Dropdown.Menu>
            </Dropdown>
            <UpdateUserModal isOpen={modal.isOpen} handleClose={() => setModal({ ...modal, isOpen: false })} currentUser={props.currentUser} handleChangeConfirmModalState={handleChangeConfirmModalState} handleUpdateAlert={handleUpdateAlert} />
            <Confirm
                open={confirm.confirmModal}
                header={confirm.headerText}
                content={confirm.contentText}
                size='large'
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

type ActiveItemOptions = 'home' | 'pipeline' | 'files' | 'cgds' | 'survival' | 'institutions' | 'about-us' | 'biomarkers' | 'open-source' | 'differential-expression' | 'faq'

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
    const intl = useIntl()
    // Gets current user context
    const currentUser = useContext(CurrentUserContext)

    const cBioPortalOption = (
        <Dropdown.Item
            text={intl.formatMessage({ id: 'mainNavbar.cbioportal' })}
            icon='cloud'
            as='a' href={urlCGDSPanel}
            active={props.activeItem === 'cgds'}
        />
    )

    return (
        <Menu className='margin-bottom-0' inverted borderless aria-label='Main navigation'>
            {/* Logo */}
            <Menu.Item as='a' header href={urlIndex} title={intl.formatMessage({ id: 'mainNavbar.logo.title' })}>
                <Image size='tiny' src='/static/frontend/img/logo.png' alt={intl.formatMessage({ id: 'mainNavbar.logo.alt' })} />
            </Menu.Item>

            {/* Loading spinners while user is fetch */}
            {props.isLoadingUser && (
                <Menu.Item>
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
                </Menu.Item>
            )}
            {/* Analysis menu */}
            {currentUser && !currentUser.is_anonymous && (
                <>
                    <Menu.Menu>
                        <Dropdown item text={intl.formatMessage({ id: 'mainNavbar.analysis' })} className='link item' icon={null} aria-label='Analysis'>
                            <Dropdown.Menu>
                                {/* GEM panel */}
                                <Dropdown.Item
                                    text={intl.formatMessage({ id: 'mainNavbar.gem' })}
                                    icon='lab'
                                    title={intl.formatMessage({ id: 'mainNavbar.gem.title' })}
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
                                    text={intl.formatMessage({ id: 'mainNavbar.biomarkers' })}
                                    icon='list layout'
                                    as='a' href={urlBiomarkers}
                                    active={props.activeItem === 'biomarkers'}
                                />

                                {/* Differential Expression panel */}
                                <Dropdown.Item
                                    text={intl.formatMessage({ id: 'mainNavbar.differentialExpression' })}
                                    icon='buromobelexperte'
                                    as='a' href={urlDifferentialExpression}
                                    active={props.activeItem === 'differential-expression'}
                                />
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Menu>

                    {/* Datasets menu */}
                    <Menu.Menu>
                        <Dropdown text={intl.formatMessage({ id: 'mainNavbar.myDatasets' })} className='link item' icon={null} aria-label='Datasets'>
                            <Dropdown.Menu>
                                {/* User's Datasets panel */}
                                <Dropdown.Item
                                    text={intl.formatMessage({ id: 'mainNavbar.myDatasets' })}
                                    icon='database'
                                    as='a' href={urlDatasets}
                                    active={props.activeItem === 'files'}
                                />

                                {/* cBioPortal Datasets panel */}
                                {cBioPortalOption}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Menu>

                    {/* Institutions  */}
                    <Menu.Menu>
                        <Menu.Item as='a' href={urlInstitutions} style={{ fontSize: '1rem' }}>
                            {intl.formatMessage({ id: 'mainNavbar.institutions' })}
                        </Menu.Item>
                    </Menu.Menu>
                </>
            )}

            {/* Only admin options */}
            {currentUser && (currentUser.is_superuser || currentUser.is_institution_admin) && (
                <Menu.Menu>
                    <Dropdown text={intl.formatMessage({ id: 'mainNavbar.admin' })} className='link item' icon={null} aria-label='Admin'>
                        <Dropdown.Menu>
                            {currentUser.is_superuser && (
                                <>
                                    {/* User's Datasets panel */}
                                    <Dropdown.Item
                                        text={intl.formatMessage({ id: 'mainNavbar.databaseGenes' })}
                                        icon='dna'
                                        // as='a' href={null}
                                        disabled
                                    />
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            )}

            {/* About us */}
            <Menu.Menu>
                <Menu.Item as='a' href={urlAboutUs} style={{ fontSize: '1rem' }}>
                    {intl.formatMessage({ id: 'mainNavbar.aboutUs' })}
                </Menu.Item>
            </Menu.Menu>

            <Menu.Menu>
                <Menu.Item
                    as='a'
                    href='/faq'
                    style={{ fontSize: '1rem' }}
                    active={props.activeItem === 'faq'}
                >
                    {intl.formatMessage({ id: 'mainNavbar.faq' })}
                </Menu.Item>
            </Menu.Menu>

            <Menu.Menu>
                <Menu.Item as='a' href={urlOpenSource} style={{ fontSize: '1rem' }}>
                    {intl.formatMessage({ id: 'mainNavbar.openSource' })}
                </Menu.Item>
            </Menu.Menu>

            {/* LogIn/LogOut panel */}
            <Menu.Menu position='right'>
                <LogInLogOutPanel currentUser={currentUser} />
            </Menu.Menu>
        </Menu>
    )
}

export { MainNavbar, ActiveItemOptions }
