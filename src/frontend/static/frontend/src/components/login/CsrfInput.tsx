import React from 'react'

declare const CSRFToken: string

/**
 * Renders the Input made for Django with the CSRF token for
 * POST request
 * @returns Input component with the CSRF token
 */
export const CsrfInput = () => <input type="hidden" name="csrfmiddlewaretoken" value={CSRFToken}/>
