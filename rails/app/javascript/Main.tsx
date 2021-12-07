import React from "react";
import { Route, Routes } from "react-router";
import * as Layouts from "./layouts";
import * as Pages from "./pages";

export default function Main(): React.ReactElement {
  return (
    <Routes>
      <Route path='/' element={<Layouts.Base/>}>
        <Route index element={<Pages.App/>} />
        <Route path='authentication' element={<Layouts.Auth/>}>
          <Route index element={<Pages.Auth.Login/>} />
          <Route path='register' element={<Pages.Auth.Register/>} />
        </Route>
      </Route>
    </Routes>
  )
}