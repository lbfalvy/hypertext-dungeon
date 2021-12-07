import { Await } from "@lbfalvy/react-await";
import React from "react";
import { Navigate } from "react-router";
import { GameTree } from "../components/GameTree";
import { Loader } from "../components/Loader";
import { Log, LogEntry } from "../components/Log";
import { Prompt } from "../components/Prompt";
import { auth, getGameServices } from "../config";
import { useLog } from "../hooks/useLog";
import { useVariable } from "../hooks/useVariable";
import './App.scss';

export function App(): React.ReactElement {
  const [log, append] = useLog<LogEntry>()
  const token = useVariable(auth.token)
  const gameSvcs = React.useMemo(() => token ? getGameServices(token) : undefined, [token])
  React.useEffect(() => gameSvcs?.onLog(append), [gameSvcs])
  if (!gameSvcs) return <Navigate to='/authentication' />
  const { act, gameState } = gameSvcs
  return <div className='App'>
    <div className='tree'>
      <Await for={GameTree} gameState={gameState} act={act}>{{
        loader: <Loader/>
      }}</Await>
    </div>
    <div className='log'>
      <Log entries={log} />
    </div>
    <div className='prompt'>
      <Prompt act={act} />
    </div>
  </div>
}