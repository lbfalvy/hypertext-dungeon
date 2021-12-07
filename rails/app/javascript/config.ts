import { Variable, filter, event } from "@lbfalvy/mini-events";
import { apiGet } from "./helpers/apiGet";
import { apiPost } from "./helpers/apiPost";
import { query } from "./helpers/query";
import { Change, Event, GameObject, Message } from "./networkTypes";
import { authService } from "./services/authService";
import { cableService } from "./services/cableService";
import { gameStateService } from "./services/gameStateService";
import { storageService } from "./services/storageService";

const auth_state = storageService<any>('auth_state')

// console.log(auth_state)

export const auth = authService({
  refreshEndpoint: '/api/v1/session/refresh',
  renewOnTtl: 10,
  lockExpiry: 1,
  storage: auth_state,
  // log: (...args) => console.log('[AUTH]', ...args)
})

// auth.token.changed((...args) => {
//   console.log('[AUTH:service]', ...args)
//   args[0]?.changed((...args) => console.log('[AUTH:token]', ...args))
// }, true)

// console.log('[AUTH] service:', auth)

export function getGameServices(token: Variable<string>) {
  const cable = cableService({
    token,
    url: '/cable', 
    // log: (...args) => console.log('[CABLE]', ...args)
  })
  const changes = filter(cable.subscribe, (m): m is Change => m.type == 'change')
  changes((...args) => console.log('[CHANGES]', ...args), true)
  const events = filter(cable.subscribe, (m): m is Event => m.type == 'event')
  const [log, onLog] = event<[Event]>()
  events(log)
  events((...args) => console.log('[EVENTS]', ...args), true)
  const gameState = gameStateService({
    fetchTree: path => apiGet(
      '/api/v1/game/tree', 
      token.get(), 
      { path: path?.join('/') }
    ) as Promise<GameObject>,
    stream: changes,
    log: (...args) => console.log('[GAMESTATE]', ...args)
  })
  function act(
    name: string, object_path: string[],
    target_path?: string[] | undefined | null,
    data?: any, role?: number
  ): Promise<void> {
    return apiPost(`api/v1/game/act${query({ role })}`, token.get(), null, {
      name, object_path, target_path, data
    })
  }
  return { gameState, onLog, act }
}