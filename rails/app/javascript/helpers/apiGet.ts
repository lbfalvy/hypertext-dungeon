import { query } from "./query"

export class HttpError extends Error {
  constructor(readonly response: Response) {
    super(`HTTP error ${response.status} ${response.statusText}`)
  }
}

export async function apiGet(
  endpoint: string, token?: string | void | null, qparams: Parameters<typeof query>[0] = {}
): Promise<any> {
  const res = await fetch(`${endpoint}${query(qparams)}`, {
    headers: {
      'Accept': 'application/json',
      ...token ? {'Authorization': `Bearer ${token}`} : {}
    }
  })
  if (!res.ok) throw new HttpError(res)
  return await res.json()
}