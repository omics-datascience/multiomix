import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/files.css'

import { FilesManager } from './components/files-manager/FilesManager'

const container = document.getElementById('files-app')
const root = createRoot(container!)
root.render(<FilesManager />)
