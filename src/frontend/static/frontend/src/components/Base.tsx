import React, { useEffect, useRef, useState } from 'react'
import { MainNavbar, ActiveItemOptions } from './MainNavbar'
import ky from 'ky'
import { DjangoUser } from '../utils/django_interfaces'
import { Nullable } from '../utils/interfaces'
import { Footer } from './Footer'
import { IntlProvider } from 'react-intl'
import { ChatWidget } from './assistant/ChatWidget'

// Locales
import es from '../locales/es'
import en from '../locales/en'

// Common dependencies for all the pages
import 'fomantic-ui-css/semantic.css'
import '../css/base.css'
import '../css/responsive.css'

const messages = { en, es }

interface LocaleContextType {
    locale: 'en' | 'es',
    setLocale: React.Dispatch<React.SetStateAction<'en' | 'es'>>
}
const LocaleContext = React.createContext<LocaleContextType>({
    locale: 'es',
    setLocale: () => {}
})

declare const urlCurrentUser: string

/**
 * Component's props
 */
interface BaseProps {
    activeItem?: ActiveItemOptions,
    children: React.ReactNode
    wrapperClass: string
}

/** A context to get the current logged user in all the site */
const CurrentUserContext = React.createContext<Nullable<DjangoUser>>(null)

/**
 * Renders the base component using the composition pattern
 * See: https://es.reactjs.org/docs/composition-vs-inheritance.html
 * @param props Component's props
 * @returns Component
 */
const Base = (props: BaseProps) => {
    const abortController = useRef(new AbortController())
    const [currentUser, setUser] = useState<Nullable<DjangoUser>>(null)
    const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState<boolean>(true)
    // State that defines the current language ('es' or 'en') for <IntlProvider>, used to display the interface in the selected locale
    const [locale, setLocale] = useState<'en' | 'es'>('es')

    /**
     * Method which is executed when the component has mounted
     */
    useEffect(() => {
        getCurrentUser()

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [])

    /**
     * Fetches logged User data
     */
    function getCurrentUser () {
        ky.get(urlCurrentUser, { retry: 5, signal: abortController.current.signal }).then((response) => {
            response.json<DjangoUser>().then((currentUser) => {
                setUser(currentUser)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (err.response.status === 403 && !abortController.current.signal.aborted) {
                // It's an anonymous user
                setUser({
                    id: null,
                    username: null,
                    is_anonymous: true,
                    is_superuser: false,
                    is_institution_admin: false,
                    last_name: '',
                    first_name: '',
                    email: ''
                })
            } else {
                console.log('Error getting current User ->', err)
            }
        }).finally(() => {
            setIsLoadingCurrentUser(false)
        })
    }

    return (
        <CurrentUserContext.Provider value={currentUser}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                <IntlProvider locale={locale} messages={messages[locale]}>
                    {/* Navbar */}
                    <MainNavbar activeItem={props.activeItem} isLoadingUser={isLoadingCurrentUser} />

                    {/* Composition part */}
                    <div className={props.wrapperClass}>
                        {props.children}
                    </div>

                    {/* Footer */}
                    {/* TODO: add license */}
                    <Footer />

                    {/* AI Assistant floating widget */}
                    {currentUser && !currentUser.is_anonymous && <ChatWidget />}
                </IntlProvider>
            </LocaleContext.Provider>
        </CurrentUserContext.Provider>
    )
}

export { Base, CurrentUserContext }
