import React from "react";

export type LogEntry = { source: string, message: string }

export interface LogProps {
  entries: LogEntry[]
}

export function Log({ entries }: LogProps): React.ReactElement {
  return <div className='Log'>
    {entries.map(({ source: from, message: text }, i) =>
      <div key={i}>
        <span className='from'>
          from {from}:
        </span>
        <span className='text'>{text}</span>
      </div>
    )}
  </div>
}