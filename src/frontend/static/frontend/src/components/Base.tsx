import React, { useEffect, useState } from 'react'
import { MainNavbar, ActiveItemOptions } from './MainNavbar'
import ky from 'ky'
import { DjangoUser } from '../utils/django_interfaces'
import { Nullable } from '../utils/interfaces'
import { Container, Grid, Segment } from 'semantic-ui-react'

declare const urlCurrentUser: string
declare const multiomixVersion: string

/**
 * Component's props
 */
interface BaseProps {
    activeItem?: ActiveItemOptions,
    children: React.ReactNode
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
    const [currentUser, setUser] = useState<Nullable<DjangoUser>>(null)

    /**
     * Method which is executed when the component has mounted
     */
    useEffect(getCurrentUser, [])

    /**
     * Fetches logged User data
     */
    function getCurrentUser () {
        ky.get(urlCurrentUser, { retry: 5 }).then((response) => {
            response.json().then((currentUser: DjangoUser) => {
                setUser(currentUser)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (err.response.status === 403) {
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
        })
    }

    return (
        <CurrentUserContext.Provider value={currentUser}>
            {/* Navbar */}
            <MainNavbar activeItem={props.activeItem}/>

            {/* Composition part */}
            <div className='wrapper'>
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
                                    OmicsDataScience | Multiomix v{multiomixVersion}
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
