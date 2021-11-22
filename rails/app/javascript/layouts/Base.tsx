import React from "react";
import { Outlet } from "react-router";
import './Base.scss';

export function Base(): React.ReactElement {
    return <div className='Base_layout'>
        <section>
            <Outlet/>
        </section>
        <footer>Some footer content</footer>
    </div>
}