import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import Main from '../Main'

const root = document.createElement('div')
root.id = 'root'
ReactDOM.render(
    <BrowserRouter>
        <Main/>
    </BrowserRouter>,
    root
)

window.addEventListener('DOMContentLoaded', () => {
    document.body.append(root)
})