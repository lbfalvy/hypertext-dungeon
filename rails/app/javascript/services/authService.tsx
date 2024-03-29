import { Emit, filter, Subscribe, variable, Variable } from "@lbfalvy/mini-events"
import jwtDecode from "jwt-decode"
import { HttpError } from "../helpers/apiGet"
import { apiPost } from "../helpers/apiPost"
import { notNull } from "../helpers/notNull"

export interface TokenPair {
  token: string,
  refresh: string
}

interface State {
  pair: TokenPair,
  lockedAt?: number
}

export interface AuthConfig {
  refreshEndpoint: string
  renewOnTtl: number
  lockExpiry: number
  storage: [Emit<[State|void]>, Variable<State|void>]
  log?: (...args: any[]) => void
}

export interface AuthService {
  isRunning(): boolean
  setPair(pair: TokenPair): void
  getToken(): string | void
  onToken: Subscribe<[string|void, string|void]>
  halt(): void
}

export interface NewAuthService {
  setPair(pair?: TokenPair | undefined): void
  forceRefresh(): Promise<void>
  token: Variable<Variable<string> | undefined>
}

function ttl(token: { exp?: number }): number {
  if (!token.exp) return Infinity 
  return token.exp - (Date.now() / 1000)
}

function decodeToken<T>(token: string): (T & { exp?: number }) {
  try {
    return jwtDecode<T>(token)
  } catch(e) {
    console.error(e)
    console.error('Offending token:', token)
    throw e
  }
}

/**
 * Function that launches token renew flow
 * @param opts Delegates and configuration
 * @returns A function that always returns a valid token
 */
export function authService(opts: AuthConfig): NewAuthService {
  const { refreshEndpoint, storage, renewOnTtl, lockExpiry, log } = opts
  const [ write, { get, changed } ] = storage
  let loop = false
  // Prevent thundering herd
  const uniqueDelay = Math.floor(Math.random() * 1000)
  /**
   * A state machine running concurrently in all tabs.
   * Principles:
   * - State may be read at any moment
   * --> continuous
   * - The whole machine may spontaneously halt and resume operation shortly or much later
   * --> timing resistant
   * - Network requests should be appropriately spaced and never repeated
   * --> locking
   * - Any single instance may spontaneously exit without cleanup
   * --> no SPOF
   */
  async function mainloop() {
    log?.(`Initializing authentication service with a unique delay of ${uniqueDelay}ms`)
    if (loop) throw new Error('Tried to launch second loop!')
    loop = true
    await Promise.resolve()
    try {
      while (loop) {
        const state = get()
        log?.('Current state:', state)
        // Initial, logged-out state
        if (!state) {
          log?.('State empty, waiting for login...')
          await new Promise<any>(r => changed(r, true, true))
          continue
        }
        const refreshToken = decodeToken(state.pair.refresh)
        // Session expired > transition to logged-out
        if (ttl(refreshToken) < 0) {
          log?.('Session expired, clearing state...')
          write()
          continue
        }
        const token = decodeToken(state.pair.token)
        // Pending request > wait for timeout, then transition if it didn't already
        // can transition to stale token or expired session
        if (state.lockedAt) {
          const expiryMs = lockExpiry * 1000
          const unlockIn = Date.now() - state.lockedAt + expiryMs
          log?.(`Waiting ${unlockIn + uniqueDelay}ms for pending request to expire...`)
          if (0 < unlockIn) {
            await new Promise<void>(res => setTimeout(res, unlockIn + uniqueDelay))
            if (get()?.lockedAt == state.lockedAt) {
              log?.('Pending request expired, clearing timeout...')
              write({ pair: state.pair })
            }
            continue
          }
        }
        // stale token > transition to pending request
        // then try refreshing the token
        // then transition to fresh token state if it didn't already
        const msToRenew = (ttl(token) - renewOnTtl) * 1000
        if (msToRenew < 0) {
          const lockedAt = Date.now()
          log?.('Stale access token, locking for renewal...')
          write({ ...state, lockedAt })
          try {
            const result: TokenPair = await apiPost(refreshEndpoint, state.pair.refresh)
            if (get()?.lockedAt != lockedAt) {
              log?.('Lock broken, discarding newly obtained state...')
              continue
            }
            log?.('Saving new pair and unlocking...')
            write({ pair: result })
          } catch(ex) {
            if (ex instanceof HttpError) {
              log?.('Encountered HTTP error', ex.response)
              if (ex.response.status == 401) {
                log?.('Invalid token, clearing state')
                write()
              }
            }
            log?.('Failed to refresh, lock maintained...')
          }
          continue
        }
        // valid token > wait until renewal due
        // transition to stale token
        log?.(`Waiting ${msToRenew + uniqueDelay}ms for access token to go stale...`)
        await new Promise<void>(res => setTimeout(res, msToRenew + uniqueDelay))
      }
    } catch(e) {
      loop = false
      throw e
    }
  }
  mainloop()
  function halt() { loop = false }
  /*const actions: AuthService = {
    getToken() {
      if (!loop) return undefined
      return get()?.pair.token
    },
    halt,
    isRunning: () => loop,
    onToken: (cb, ...flags) => subscribe((s, old) => cb(s?.pair.token, old?.pair.token), ...flags),
    setPair(pair) {
      write({ pair })
      if (!loop) mainloop()
    }
  }
  new FinalizationRegistry<void>(halt).register(actions.getToken)*/
  function createTokenVar(): Variable<string> {
    log?.('Constructing new token variable')
    const state = get()
    if (!state) throw new Error('No active token')
    const [set, v] = variable<string>(state.pair.token)
    const dispose = changed((fresh, old) => {
      if (fresh && old && fresh.pair.token == old.pair.token) return
      log?.('updating token string:', fresh)
      if (fresh == undefined) dispose()
      else set(fresh.pair.token)
    }, true)
    return v
  }
  const [setToken, token] = variable<Variable<string>>()
  changed((fresh, old) => {
    log?.('storage event old:', old, 'fresh:', fresh)
    if (!old) setToken(createTokenVar())
    if (!fresh) setToken(undefined)
  })
  if (get()) setToken(createTokenVar())
  const actions: NewAuthService = {
    setPair(pair) {
      if (pair) {
        write({ pair })
        if (!loop) mainloop()
      } else { write(); halt() }
    },
    async forceRefresh() {
      const state = notNull(get(), Error, 'use setPair')
      const lockedAt = Date.now()
      write({ ...state, lockedAt })
      const result: TokenPair = await apiPost(refreshEndpoint, state.pair.refresh)
      if (get()?.lockedAt != lockedAt) throw new Error('Lock broken')
      write({ pair: result })
    },
    token
  }
  return actions
}