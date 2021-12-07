import React from "react";
import { Outlet } from "react-router";
import { auth } from "../config";
import './Base.scss';

export function Base(): React.ReactElement {
  return <div className='Base_layout'>
    <section>
      <Outlet/>
    </section>
    <footer>Some footer content <button onClick={() => auth.setPair()}>Logout</button></footer>
  </div>
}