import React from "react";

export function Loader(): React.ReactElement {
  const [phase, setPhase] = React.useState(0)
  React.useEffect(() => {
    const h = setTimeout(() => setPhase((phase + 1) % 5), 500)
    return () => clearTimeout(h)
  })
  return <span className='Loader'>
    Loading{'.'.repeat(phase)}
  </span>
}