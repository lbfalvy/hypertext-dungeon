import React from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import { auth } from "../../config"

export function Login(): React.ReactElement {
    const [params, setParams] = useSearchParams()
    const [username, setUsername] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const submit = async () => {
        if (loading) return
        setLoading(true)
        try {
            const result = await fetch('/api/v1/users/authenticate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            const data = await result.json()
            if (data.error) throw new Error(data.error)
            auth.setPair(data)
        } catch(e: any) {
            setError(e.message)
        }
        setLoading(false)
    }
    if (auth.isRunning() && auth.getToken())
        return <Navigate to={`/${params.get('redirect') ?? ''}`} />
    return <div className='Login'>
        {error.length ?
            <div className='message'>Failed to log in: {error}</div>
        : null}
        <input placeholder='Username' onChange={e => setUsername(e.target.value)} />
        <input placeholder='Password' onChange={e => setPassword(e.target.value)} />
        {loading ? <button disabled>Loading...</button>
        : <button onClick={submit}>Login</button>}
    </div>
}