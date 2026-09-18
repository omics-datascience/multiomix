import React from 'react'
import { Form, Message, Button, Image } from 'semantic-ui-react'
import { Nullable } from '../../utils/interfaces'
import { CsrfInput } from './CsrfInput'
import validator from 'validator'
import { injectIntl, IntlShape } from 'react-intl'

declare const urlIndex: string
declare const urlAuthenticate: string
declare const urlCreateUser: string
declare const loginError: string
declare const loginWarning: string
declare const loginSuccess: string

/**
 * Component's state
 */
interface LoginSignUpState {
    username: string,
    password: string,
    newUsername: string,
    email: string,
    newPassword: string,
    newPasswordRepeated: string,
    showSignUpForm: boolean
}

interface GeneralFormProps {
    title: string,
    url: string,
    children: React.ReactNode
}

interface LoginSignUpFormProps { intl: IntlShape }

/**
 * Renders a General from with the "Render props" pattern
 * to minimize the repeated code
 * @param props Component's props
 * @returns Component
 */
const GeneralForm = (props: GeneralFormProps) => {
    // Defines redirection target in case a successful login
    const nextUrl = new URLSearchParams(window.location.search).get('next') ?? urlIndex

    return (
        <div className='container-login'>
            <div className='wrap-login'>
                <Form className='login-form validate-form' action={props.url} method='POST'>
                    <span className='login-form-logo'>
                        <Image circular size='large' src='/static/frontend/img/logo-login.png' alt='logo-login' />
                    </span>

                    <span className='login-form-title'>
                        {props.title}
                    </span>

                    {/* Renders login/sign up page */}
                    {props.children}

                    {/* CSRF Token is needed in both pages */}
                    <CsrfInput />

                    <input type='hidden' name='next' value={nextUrl} />
                </Form>
            </div>
        </div>
    )
}

/**
 * Renders a Login/Sign up form
 */
class LoginSignUpForm extends React.Component<LoginSignUpFormProps, LoginSignUpState> {
    constructor (props) {
        super(props)

        this.state = {
            username: '',
            password: '',
            newUsername: '',
            email: '',
            newPassword: '',
            newPasswordRepeated: '',
            showSignUpForm: false
        }
    }

    /**
     * Updates the component state from the user input
     * @param e Change event
     */
    handleInputChange = (e) => { this.setState<never>({ [e.target.name]: e.target.value }) }

    /**
     * Checks that the login form is valid!
     * @returns True if the login form is valid, false otherwise
     */
    loginFormIsValid (): boolean {
        return this.state.username.trim().length > 0 &&
            this.state.password.trim().length > 0
    }

    /**
     * Checks that the Sign Up form is valid!
     * @returns True if the sign up form is valid, false otherwise
     */
    signUpFormIsValid (): boolean {
        const newPasswordTrimmed = this.state.newPassword.trim()
        const newPasswordRepeatedTrimmed = this.state.newPasswordRepeated.trim()
        return this.state.newUsername.trim().length > 0 &&
            this.state.email.trim().length > 0 &&
            newPasswordTrimmed.length > 0 &&
            newPasswordRepeatedTrimmed.length > 0 &&
            newPasswordTrimmed === newPasswordRepeatedTrimmed &&
            this.emailIsValid()
    }

    /**
     * Checks that the provided mail is valid!
     * @returns True if the informed mail is valid, false otherwise
     */
    emailIsValid (): boolean {
        return validator.isEmail(this.state.email.trim())
    }

    /**
     * Renders the Login
     * @returns Error message if exists. Login component otherwise
     */
    getLoginPanel () {
        const { intl } = this.props
        let message: Nullable<JSX.Element> = null

        if (loginError.length > 0) {
            message = (
                <Message negative>
                    <Message.Header className='align-center'>{loginError}</Message.Header>
                </Message>
            )
        } else {
            if (loginWarning.length > 0) {
                message = (
                    <Message warning>
                        <Message.Header className='align-center'>{loginWarning}</Message.Header>
                    </Message>
                )
            } else {
                if (loginSuccess.length > 0) {
                    message = (
                        <Message success>
                            <Message.Header className='align-center'>{loginSuccess}</Message.Header>
                        </Message>
                    )
                }
            }
        }

        return (
            <GeneralForm title={intl.formatMessage({ id: 'loginSignUpForm.loginTitle' })} url={urlAuthenticate}>
                {message}

                <Form.Input
                    fluid
                    icon='user'
                    iconPosition='left'
                    className='wrap-login-input'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.usernamePlaceholder' })}
                    name='username'
                    value={this.state.username}
                    onChange={this.handleInputChange}
                />

                <Form.Input
                    fluid
                    icon='lock'
                    iconPosition='left'
                    className='wrap-login-input'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.passwordPlaceholder' })}
                    name='password'
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    type='password'
                />

                <Form.Group className='margin-top-5' widths='equal'>
                    <Form.Field
                        fluid
                        control={Button}
                        size='huge'
                        className='action-button'
                        circular
                        type='button'
                        onClick={() => this.setState({ showSignUpForm: true })}
                    >
                        {intl.formatMessage({ id: 'loginSignUpForm.signUpButton' })}
                    </Form.Field>

                    <Form.Button
                        fluid
                        size='huge'
                        type='submit'
                        className='action-button'
                        circular
                        disabled={!this.loginFormIsValid()}
                    >
                        {intl.formatMessage({ id: 'loginSignUpForm.loginButton' })}
                    </Form.Button>
                </Form.Group>

                {/* <div className="text-center p-t-90">
                        <a className="txt1" href="#">
                            Forgot Password?
                        </a>
                    </div> */}
            </GeneralForm>
        )
    }

    /**
     * Renders the Sign Up Button/panel
     * @returns Sign up form component
     */
    getSignUpPanel () {
        const { intl } = this.props
        const passwordsMismatch = this.state.newPassword !== this.state.newPasswordRepeated
        const emailIsNotValid = this.state.email != null && this.state.email.trim().length > 0 && !this.emailIsValid()

        return (
            <GeneralForm title={intl.formatMessage({ id: 'loginSignUpForm.signUpTitle' })} url={urlCreateUser}>
                <Form.Input
                    fluid
                    icon='user'
                    iconPosition='left'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.usernamePlaceholder' })}
                    name='newUsername'
                    value={this.state.newUsername}
                    onChange={this.handleInputChange}
                />

                <Form.Input
                    fluid
                    icon='mail'
                    iconPosition='left'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.emailPlaceholder' })}
                    name='email'
                    error={emailIsNotValid}
                    value={this.state.email}
                    onChange={this.handleInputChange}
                />
                {emailIsNotValid && (
                    <p className='align-center error-message-helper'>
                        {intl.formatMessage({ id: 'loginSignUpForm.validEmailMessage' })}
                    </p>
                )}
                <Form.Input
                    fluid
                    icon='lock'
                    iconPosition='left'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.passwordPlaceholder' })}
                    name='newPassword'
                    value={this.state.newPassword}
                    onChange={this.handleInputChange}
                    type='password'
                />
                <Form.Input
                    fluid
                    icon='lock'
                    iconPosition='left'
                    placeholder={intl.formatMessage({ id: 'loginSignUpForm.repeatPasswordPlaceholder' })}
                    className='password-repeated-input'
                    name='newPasswordRepeated'
                    error={passwordsMismatch}
                    value={this.state.newPasswordRepeated}
                    onChange={this.handleInputChange}
                    type='password'
                />
                {passwordsMismatch && (
                    <p className='align-center error-message-helper'>
                        {intl.formatMessage({ id: 'loginSignUpForm.passwordMismatchMessage' })}
                    </p>
                )}

                <Form.Group className='margin-top-5' widths='equal'>
                    <Form.Field
                        fluid
                        control={Button}
                        size='huge'
                        className='action-button'
                        circular
                        type='button'
                        onClick={() => this.setState({ showSignUpForm: false })}
                    >
                        {intl.formatMessage({ id: 'common.goBack' })}
                    </Form.Field>

                    <Form.Button
                        fluid
                        size='huge'
                        className='action-button'
                        circular
                        type='submit'
                        disabled={!this.signUpFormIsValid()}
                    >
                        {intl.formatMessage({ id: 'loginSignUpForm.signUpButton' })}
                    </Form.Button>
                </Form.Group>

            </GeneralForm>
        )
    }

    render () {
        return !this.state.showSignUpForm ? this.getLoginPanel() : this.getSignUpPanel()
    }
}

export default injectIntl(LoginSignUpForm)
