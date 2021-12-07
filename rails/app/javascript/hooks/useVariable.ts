import { Variable } from "@lbfalvy/mini-events";
import React from "react";

export function useVariable<T>(v: Variable<T>, log?: (...args: any[]) => void): T {
  const [result, setResult] = React.useState(v.get())
  React.useEffect(() => {
    setResult(v.get())
    return v.changed((fresh, old) => {
      log?.('variable changed from "', old, '" TO "', fresh, '"')
      setResult(fresh)
    }, true)
  }, [v])
  return result
}