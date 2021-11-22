import React from "react";
import { Navigate, useNavigate } from "react-router";
import { auth } from "../config";

export function App(): React.ReactElement {
    const navigate = useNavigate()
    // Redirect to login when the token is cleared...
    React.useEffect(
        () => auth.onToken(
            token => token || navigate('/authentication'),
            true
        )
    )
    // ...or immediately if it's not present to begin with
    if (!auth.getToken()) return <Navigate to='/authentication' />
    return (
        <>The main view will appear here</>
    )
}