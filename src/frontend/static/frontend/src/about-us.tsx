import React from 'react'
import { createRoot } from 'react-dom/client'
// import ReactDOM from 'react-dom'
import { AboutUs } from './components/about-us/AboutUs'

// const root = ReactDOM.createRoot(document.getElementById('about-us-app'))
const container = document.getElementById('about-us-app')
const root = createRoot(container!)
root.render(<AboutUs />)
