import { HttpError } from "./apiGet";
import { query } from "./query";

export async function apiPost(
  endpoint: string, token: string | void | null, qparams: Parameters<typeof query>[0] | void | null, body?: any | void | null
): Promise<any> {
  const res = await fetch(`${endpoint}${query(qparams ?? {})}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...body? { 'Content-Type': 'application/json' } :{},
      ...token? {'Authorization': `Bearer ${token}`} :{}
    },
    ...body? { body: JSON.stringify(body) } :{}
  })
  if (!res.ok) throw new HttpError(res)
  try { return await res.json() }
  catch { return undefined }
}