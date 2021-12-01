## When an action is taken

0. Load subject. Initialise both object and target to subject.
1. Parse subject's state.
2. Resolve respective paths on object and target
3. Branch if object or target has intercept or react handlers
  1. Add them to intercept and react queues
4. If either object or target changed, go to 2.
5. Parse object's and target's state, enqueueing any GameObjects for load.
6. Call each intercept handler, if any throws, halt the whole thing
7. Call execute on object
8. Call interact on target
9. Call react handlers, they cannot throw but they can trigger new Actions.

## When a user enters

Send the names, actions, classes and children of their entire subtree

## When an object changes

Search their whole children reverse graph for nodes which can see and call see

## When an object makes a sound

0. Search their whole heard + children overlain reverse graph for nodes which can hear
1. call hear with every visited node as audience