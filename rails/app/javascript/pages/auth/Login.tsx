import React from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import { auth } from "../../config"
import { apiPost } from "../../helpers/apiPost"
import { useVariable } from "../../hooks/useVariable"

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
      const data = await apiPost('/api/v1/users/authenticate', null, {}, { username, password })
      if (data.error) throw new Error(data.error)
      auth.setPair(data)
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false)
  }
  const token = useVariable(auth.token)
  console.log("TOKEN IS", token)
  React.useEffect(() => auth.token.changed(v => console.log(`TOKEN CHANGED TO`, v), true))
  if (token) return <Navigate to={`/${params.get('redirect') ?? ''}`} />
  return <div className='Login'>
    {error.length?
      <div className='message'>Failed to log in: {error}</div>
    :null}
    <input placeholder='Username' onChange={e => setUsername(e.target.value)} />
    <input placeholder='Password' onChange={e => setPassword(e.target.value)} />
    {loading ? <button disabled>Loading...</button>
    : <button onClick={submit}>Login</button>}
  </div>
}