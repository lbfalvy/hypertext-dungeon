import { Emit, variable, Variable } from "@lbfalvy/mini-events";
import { ContextMenu } from "@lbfalvy/react-context-menu";
import { classList } from "@lbfalvy/react-utils";
import React from "react";
import { notNull } from "../helpers/notNull";
import { useVariable } from "../hooks/useVariable";
import { GameObject, GameStateService } from "../services/gameStateService";
import './GameTree.scss';

type Writable<T> = [Emit<[T]>, Variable<T>]
type Act = (name: string, object_path: string[], target_path?: string[]) => void

const gameCtx = React.createContext<GameStateService|null>(null)
function useGameObject(id: number): GameObject {
  const ctx = notNull(React.useContext(gameCtx), Error, 'Game context not initialized')
  const [obj, setObj] = React.useState(ctx.getObject(id))
  React.useLayoutEffect(() => ctx.change(n => {
    if (n == id) setObj(ctx.getObject(id))
  }), [id])
  return obj.id == id ? obj : ctx.getObject(id)
}
const hoverCtx = React.createContext<Writable<number>>(variable(-1))
const targetingCtx = React.createContext<Writable<[string[], string] | undefined>>(variable())
const actCtx = React.createContext<Act | undefined>(undefined)
const useAct = () => notNull(React.useContext(actCtx), Error, 'Action context not initialized')

interface GameTreeProps {
  gameState: GameStateService
  act: Act
}

export function GameTree({ gameState, act }: GameTreeProps): React.ReactElement {
  return <div className='GameTree'>
    <gameCtx.Provider value={gameState}>
      <actCtx.Provider value={act}>
        <TreeChildren id={gameState.root} path={[]} />
      </actCtx.Provider>
    </gameCtx.Provider>
  </div>
}

function TreeChildren({ id, path }: { id: number, path: string[] }): React.ReactElement {
  const object = useGameObject(id)
  return <div className='TreeChildren'>
    {Object.entries(object.entries).map(([name, childId]) => 
      <TreeNode key={childId} name={name} id={childId} path={[...path, name]} />
    )}
  </div>
}

interface TreeNodeProps {
  name: string
  id: number
  path: string[]
}

function TreeNode({ name, id, path }: TreeNodeProps): React.ReactElement {
  const [open, toggle] = React.useReducer(b => !b, false)
  return <div className='TreeNode'>
    <NameTag open={open} onToggle={toggle} id={id} path={path}>{name}</NameTag>
    {open? <TreeChildren id={id} path={path} /> :null}
  </div>
}

interface NameTagProps {
  children: string
  id: number
  path: string[]
  open: boolean
  onToggle: () => void
}

function NameTag({ children, id, open, onToggle, path }: NameTagProps): React.ReactElement {
  const object = useGameObject(id)
  const [setHover, hover] = React.useContext(hoverCtx)
  const hovered = useVariable(hover)
  const [setTargeting, targeting] = React.useContext(targetingCtx)
  const [action_object, action] = useVariable(targeting) ?? []
  const targetable = action !== undefined && object.targetedBy.some(at => at.name == action)
  const act = useAct()
  return <>
    <ContextMenu style={{ display: 'contents' }} options={object.actionTypes.map(action => [
      <div className={classList('action', action.canTarget && 'can-target')}>
        {action.name}
      </div>,
      action.canTarget
        ? () => setTargeting([path, action.name])
        : () => act(action.name, path)
    ])}>
      <span className={classList('NameTag', hovered == id && 'hover', targetable && 'targetable')}
        onClick={onToggle} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(-1)}
      >
        <Toggle open={open} />
        {children} 
        {targetable ?
          <span className='target' onClick={e => {
            e.stopPropagation()
            act(action, action_object!, path)
            setTargeting(undefined)
          }}>
            execute
          </span>
        : null}
      </span>
    </ContextMenu>
  </>
}

function Toggle({ open, onClick }: { open: boolean, onClick?: () => void }): React.ReactElement {
  return <span className={classList('Toggle', open && 'open')}>
    [{open?'-':'+'}]
  </span>
}