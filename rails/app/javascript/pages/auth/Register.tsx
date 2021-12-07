import React from "react";
import { apiPost } from "../../helpers/apiPost";

export function Register(): React.ReactElement {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const submit = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await apiPost('/api/v1/users/create', null, {}, { username, password })
      if (data.error) throw new Error(data.error)
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false)
  }
  return <div className='Register'>
    {error.length ?
      <div className='message'>Failed to register: {error}</div>
    : null}
    <input placeholder='Username' onChange={e => setUsername(e.target.value)} />
    <input placeholder='Password' onChange={e => setPassword(e.target.value)} />
    {loading ?
      <button onClick={submit}>Register</button>
    : <button disabled>Loading...</button>}
  </div>
}