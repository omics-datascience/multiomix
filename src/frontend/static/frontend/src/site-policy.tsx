import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/site-policy.css'

import { SitePolicy } from './components/site-policy/SitePolicy'

const container = document.getElementById('site-policy-app')
const root = createRoot(container!)
root.render(<SitePolicy />)
