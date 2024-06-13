import React, { useEffect, useRef, useState } from 'react'
import { MainNavbar, ActiveItemOptions } from './MainNavbar'
import ky from 'ky'
import { DjangoUser } from '../utils/django_interfaces'
import { Nullable } from '../utils/interfaces'
import { Container, Grid, Segment } from 'semantic-ui-react'

declare const urlCurrentUser: string
declare const urlSitePolicy: string
declare const multiomixVersion: string

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
        setTimeout(() => {
            ky.get(urlCurrentUser, { retry: 5, signal: abortController.current.signal }).then((response) => {
                response.json().then((currentUser: DjangoUser) => {
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
                        is_institution_admin: false

                    })
                } else {
                    console.log('Error getting current User ->', err)
                }
            }).finally(() => {
                setIsLoadingCurrentUser(false)
            })
        }, 200)
        /*  ky.get(urlCurrentUser, { retry: 5, signal: abortController.current.signal }).then((response) => {
             response.json().then((currentUser: DjangoUser) => {
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
                     is_institution_admin: false
                 })
             } else {
                 console.log('Error getting current User ->', err)
             }
         }) */
    }

    const sitePolicyLink = <a id='site-policy-link' href={urlSitePolicy}>Terms and privacy policy</a>

    return (
        <CurrentUserContext.Provider value={currentUser}>
            {/* Navbar */}
            <MainNavbar activeItem={props.activeItem} isLoadingUser={isLoadingCurrentUser} />

            {/* Composition part */}
            <div className={props.wrapperClass}>
                {props.children}
            </div>

            {/* Footer */}
            {/* TODO: add license */}
            <Segment id='footer' inverted vertical>
                <Container>
                    <Grid divided inverted stackable textAlign='center'>
                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <p>
                                    OmicsDataScience | Multiomix v{multiomixVersion} | {sitePolicyLink}
                                </p>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </Segment>
        </CurrentUserContext.Provider>
    )
}

export { Base, CurrentUserContext }
