import React from 'react'
import ReactDOM from 'react-dom'
import './css/files.css'

import { FilesManager } from './components/files-manager/FilesManager'

ReactDOM.render(
    <FilesManager/>,
    document.getElementById('files-app')
)
