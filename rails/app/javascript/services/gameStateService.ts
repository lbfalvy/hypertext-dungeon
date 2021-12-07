import { event, Subscribe } from '@lbfalvy/mini-events'
import { produce } from 'immer'
import Semaphore from 'semaphore-async-await'
import { apiGet } from '../helpers/apiGet'
import { MultiMap } from '../helpers/multimap'
import { notNull } from '../helpers/notNull'
import { uniq } from '../helpers/uniq'

export interface ActionType {
  name: string,
  canTarget: boolean
}

export interface GameObject {
  id: number
  type: string
  version: number
  entries: Record<string, number>
  targetedBy: ActionType[]
  actionTypes: ActionType[]
}

type Delta =
  & {
    path: string[]
    version: number
    change: 'add'|'remove'
  }
  & (
    | {
        property: 'actionTypes'|'targetedBy'
        value: ActionType
      }
    | {
        property: 'entries'
        value: {name:string, child:number}
      }
    )

export interface GameStateService {
  root: number
  getRoot(): GameObject
  getObject(id: number): GameObject
  resolvePath(path: string[]): number
  change: Subscribe<[number]>
  dispose(): void
}

interface NetworkTree {
  id: number
  type: string
  version: number
  entries: Record<string, NetworkTree | number>
  targetedBy: ActionType[]
  actionTypes: ActionType[]
}

interface State {
  root: number
  index: Map<number, GameObject>
  targets: MultiMap<ActionType, number>
}

const uniqAT = uniq<ActionType>(at => `${at.canTarget}:${at.name}`)

// Add a new object into the gamestate
function introduceSubtree(state: Omit<State, 'root'>, { id, type, version, actionTypes, entries, targetedBy }: NetworkTree): GameObject {
  try {
    const old = getNode(state, id)
    if (old.version == version) return old
  } catch {}
  const go: GameObject = {
    id, type, version,
    actionTypes: actionTypes.map(uniqAT),
    targetedBy: targetedBy.map(uniqAT),
    entries: {}
  }
  for (const at of go.targetedBy)
    if (!state.targets.keyIncludes(at, id))
      state.targets.push(at, id)
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value == 'number') go.entries[key] = value
    else {
      go.entries[key] = value.id
      introduceSubtree(state, value)
    }
  }
  setNode(state, id, go)
  return go
}

// Remove all references to an object
function eliminateObject(state: State, id: number): void {
  state.index.delete(id)
  state.targets.deleteValue(id)
}

// Resolve an absolute path on the given gamestate
function walk(
  origin: number | GameObject, 
  getNode: (id: number) => GameObject, 
  path: string[]
): [number, GameObject] {
  const obj = path.reduce(
    (obj, section) => {
      const key = obj.entries[section]
      const step = getNode(key)
      if (step == undefined) debugger;
      return notNull(step, Error)
      // notNull(, Error, `Invalid path ${path.join('/')}`)
    },
    typeof origin == 'number' ? getNode(origin) : origin
  )
  return [obj.id, obj]
}

function getNode(state: Pick<State, 'index'>, id: number): GameObject {
  const key = Number.parseInt(id.toString())
  const result = state.index.get(key)
  if (result == undefined) {
    // debugger;
    // if (state.index.has(key)) debugger;
    // else if (state.index.has(id)) debugger;
    throw new Error('Object with this ID not found!')
  }
  return result
}

function setNode(state: Pick<State, 'index'>, id: number, object: GameObject): void {
  const key = Number.parseInt(id.toString())
  state.index.set(key, object)
}

export interface GameStateServiceConfig {
  stream: Subscribe<[Delta]>
  fetchTree: (path?: string[]) => Promise<NetworkTree>
  log?: (...args: any[]) => void
}

export async function gameStateService({ stream, fetchTree, log }: GameStateServiceConfig): Promise<GameStateService> {
  // Incorporate a change into the current game state
  async function transformTree(state: State, change: Delta) {
    await lock.acquire()
    const [id, object] = walk(state.root, id => getNode(state, id), change.path)
    // Discard and re-fetch the object if the version numbers don't match
    if (object.version +1 != change.version) {
      log?.('Version mismatch',object.version+1,'!=',change.version,':',object,'!=',change)
      const newTree = await fetchTree(change.path)
      eliminateObject(state, id)
      introduceSubtree(state, newTree)
    } else {
      // Apply the patch if the version number matches
      let newObject: GameObject
      if (change.property == 'entries') {
        if (change.change == 'remove') newObject = produce(object, o => {
          delete o.entries[change.value.name]
          o.version++
        })
        else {
          const path = [...change.path, change.value.name]
          let child: GameObject
          try { child = getNode(state, change.value.child) }
          catch { child = introduceSubtree(state, await fetchTree(path)) }
          newObject = produce(object, o => {
            o.entries[change.value.name] = child.id
            o.version++
          })
        }
      } else {
        const value = uniqAT(change.value)
        const property = camelCase(change.property) as 'actionTypes' | 'targetedBy'
        newObject = produce(object, o => {
          const array = o[property]
          if (change.change == 'add') array.push(value)
          else array.splice(array.indexOf(value))
          o.version++
        })
        if (property == 'targetedBy') state.targets.push(value, id)
      } // not entries
      setNode(state, id, newObject)
    } // version matched
    lock.release()
  } // transformTree
  const [emitChange, subscribeChange] = event<[number]>()
  const rootObject = await fetchTree([])
  const state: State = {
    index: new Map(),
    targets: new MultiMap(),
    root: rootObject.id
  }
  const lock = new Semaphore(1)
  introduceSubtree(state, rootObject)
  const dispose = stream(async (msg) => {
    await transformTree(state, msg)
    return emitChange(walk(state.root, id => getNode(state, id), msg.path)[0])
  })
  return {
    root: state.root,
    getRoot: () => getNode(state, state.root),
    getObject: id => {
      const o = getNode(state, id)
      if (o) return o
      throw new Error('Unknown object ID')
    },
    change: subscribeChange,
    resolvePath: path => walk(state.root, id => getNode(state, id), path)[0],
    dispose
  }
}