import React from "react";

export function useLog<T>(): [T[], (t: T) => void, () => void] {
  const [log, act] = React.useReducer((log: T[], [command, ...args]: ['push', ...T[]] | ['clear']) => {
    switch (command) {
      case 'clear': return []
      case 'push': return [...log, ...args]
    }
  }, [])
  return [log, t => act(['push', t]), () => act(['clear'])]
}