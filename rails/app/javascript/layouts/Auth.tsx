import React from "react";
import { Outlet } from "react-router";
import { NavLink } from "react-router-dom";
import './Auth.scss';

export function Auth(): React.ReactElement {
    return <div className='Auth_layout'>
        <nav>
            <NavLink to='.'>Login</NavLink>
            <NavLink to='register'>Register</NavLink>
        </nav>
        <Outlet/>
    </div>
}