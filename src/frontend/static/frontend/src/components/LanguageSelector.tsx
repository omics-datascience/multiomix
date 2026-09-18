import React, { useContext } from 'react'
import { Dropdown, Flag } from 'semantic-ui-react'
import { useIntl } from 'react-intl'
import { LocaleContext } from './Base'

/**
 * Allows the user to change the interface language without reloading the page.
 * @returns Component
 */
const LanguageSelector = () => {
    const intl = useIntl()
    const { locale, setLocale } = useContext(LocaleContext)

    return (
        <Dropdown
            item
            text={locale === 'es' ? 'Español' : 'English'}
            aria-label={intl.formatMessage({ id: 'mainNavbar.language' })}
        >
            <Dropdown.Menu>
                <Dropdown.Item active={locale === 'es'} onClick={() => setLocale('es')}>
                    <Flag name='es' />
                    Spanish (Español)
                </Dropdown.Item>
                <Dropdown.Item active={locale === 'en'} onClick={() => setLocale('en')}>
                    <Flag name='gb' />
                    English
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    )
}

export { LanguageSelector }
