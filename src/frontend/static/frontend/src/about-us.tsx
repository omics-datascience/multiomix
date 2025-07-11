import React from 'react'
import { createRoot } from 'react-dom/client'
import { AboutUs } from './components/about-us/AboutUs'

const container = document.getElementById('about-us-app')
const root = createRoot(container!)
root.render(<AboutUs />)
