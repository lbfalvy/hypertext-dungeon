Certain properties are tracked in the database as their own fields. A change to them can cause side effects, so they have to be updated programmatically.

```ts
interface Property<T> {
  set(T): void
  get(): T
}
```

GameObjects are
- atoms of position
- atoms of visibility
- atoms of interaction

```ts
interface GameObject {
  name: Property<string> // displayed in the object tree
  action_types: Property<ActionType[]> // Listed in the right-click menu
  targetable: Property<ActionType[]> // Action types specify which classes they target

  /** Handlers for actions */
  execute?(a: Action): ObjectResult // Called on the object
  interact?(a: Action, o: ObjectResult): TargetResult // Called on the target

  /**
   * Displayed in the tree structure
   * Resolvable objects in audible events
   * Action objects
   */    
  children?: Property<GameObject[]>

  /**
   * Hooks into actions indirectly involving the object
   * Called if the object or target were accessed through this
   * op and tp are relative, at least one of them is defined
   */
  intercept?(a: Action, op?: Path|void, tp?: Path|void) // Before (can throw to prevent action)
  react?(a: Action, or: ObjectResult, tr: TargetResult, op?: Path|void, tp?: Path|void) // after 
  
  /**
   * Objects from where sound events can be heard
   * children are always included by default 
   */
  acousticSpaces?: Property<GameObject[]>

  /**
   * React to hearable events and tree changes
   */
  see?(o: GameObject, prop: string, value: any)
  hear?(event: SoundEvent, audience: GameObject[]) // audience= every object where the sound was heard
}
```

Possible actions are represented by a descriptor.

```ts
interface ActionType {
  name: string
  targets: boolean
}
const put = {
  name: 'put',
  targets: true
}
```

Actions as taken by the user are represented by an object like this after tree traversal. They can be executed from the right-click menu, but they can also be written in chat as `\<name> <objectPath> <targetPath>`

```ts
interface Action {
  subject: GameObject
  object?: GameObject
  target?: GameObject
  name: string
}
const action = {
  name: "put",
  subject: player,
  object: loot,
  target: bag
}
```

When something makes a sound, a sound event is created and dispatched to everyone in hearing range

```ts
interface SoundEvent {
  /**
   * describe to someone who knows the provided objects
   * Format is provided for highighting and UI convenience
   */
  fill(GameObject[]): [string, string & Format]
  name: string
}
```