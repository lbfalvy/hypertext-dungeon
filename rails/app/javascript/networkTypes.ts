export type Event = {
  type: 'event'
  message: string
  source: string
  role: number
}

export type Change =
  & {
      type: 'change'
      path: string[]
      version: number
      change: 'add'|'remove'
    }
  & (
      | {
          property: keyof GameObject & 'actionTypes'|'targetedBy'
          value: ActionType
        }
      | {
          property: keyof GameObject & 'entries'
          value: {
            name: string
            child: number
          }
        }
    )

export type Message = Event | Change

export type ActionType = {
  name: string
  canTarget: boolean
}

export type GameObject = {
  id: number
  type: string
  version: number
  actionTypes: ActionType[]
  targetedBy: ActionType[]
  entries: Record<string, GameObject | number>
}