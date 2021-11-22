import { Subscribe, Variable } from "@lbfalvy/mini-events"
import jwtDecode from "jwt-decode"
import React from "react"

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
    storage: Variable<State|void>
    log?: (...args: any[]) => void
}

export interface AuthService {
    isRunning(): boolean
    setPair(pair: TokenPair): void
    getToken(): string | void
    onToken: Subscribe<[string|void, string|void]>
    halt(): void
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
export function authService(opts: AuthConfig): AuthService {
    const { refreshEndpoint, storage, renewOnTtl, lockExpiry, log } = opts
    const [ write, read, subscribe ] = storage
    let loop = false
    // Prevent thundering herd
    const uniqueDelay = Math.floor(Math.random() * 1000)
    /**
     * A state machine running concurrently in all tabs.
     * Principles:
     * - State may be read at any moment
     *  --> continuous
     * - The whole machine may spontaneously halt and resume operation shortly or much later
     *  --> timing resistant
     * - Network requests should be appropriately spaced and never repeated
     *  --> locking
     * - Any single instance may spontaneously exit without cleanup
     *  --> no SPOF
     */
    async function mainloop() {
        log?.(`Initializing authentication service with a unique delay of ${uniqueDelay}ms`)
        if (loop) throw new Error('Tried to launch second loop!')
        loop = true
        await Promise.resolve()
        try {
            while (loop) {
                const state = read()
                log?.('Current state:', state)
                // Initial, logged-out state
                if (!state) {
                    log?.('State empty, waiting for login...')
                    await new Promise<any>(r => subscribe(r, true, true))
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
                        if (read()?.lockedAt == state.lockedAt) {
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
                        const response = await fetch(refreshEndpoint, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${state.pair.refresh}`
                            }
                        })
                        const result: TokenPair | { error:string } = await response.json()
                        if ('error' in result) throw new Error(result.error)
                        if (read()?.lockedAt != lockedAt) {
                            log?.('Lock broken, discarding newly obtained state...')
                            continue
                        }
                        log?.('Saving new pair and unlocking...')
                        write({ pair: result })
                    } catch {
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
    const actions: AuthService = {
        getToken() {
            if (!loop) return undefined
            return read()?.pair.token
        },
        halt,
        isRunning: () => loop,
        onToken: (cb, ...flags) => subscribe((s, old) => cb(s?.pair.token, old?.pair.token), ...flags),
        setPair(pair) {
            write({ pair })
            if (!loop) mainloop()
        }
    }
    new FinalizationRegistry<void>(halt).register(actions.getToken)
    return actions
}