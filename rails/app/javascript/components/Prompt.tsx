import { classList } from "@lbfalvy/react-utils";
import React from "react";
import './Prompt.scss'

export interface PromptProps {
  act: (
    action: string, object: string[],
    target?: string[] | undefined | null,
    data?: any
  ) => Promise<void>
}

export function Prompt({ act }: PromptProps): React.ReactElement {
  const [text, setText] = React.useState('')
  const [focus, setFocus] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if (e.key == '/') {
        input.current?.focus()
        if (text == '') setText('/')
      }
      if (e.key == 'c') input.current?.focus()
    }
    window.addEventListener('keypress', cb)
    return () => window.removeEventListener('keypress', cb)
  }, [])
  const handleKeyPress = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      if (e.shiftKey) return setText(text + '\n')
      else if (text.startsWith('/')) {
        const withoutSlash = text.slice(1)
        const [action, rest] = withoutSlash.split(' ', 2)
        const [object, target] = rest.includes(';') ? rest.split(';').map(s => s.trim()) : [rest, null]
        act(action, object.split('/'), target?.split('/'))
      }
      else act('say', [], null, text)
      return setText('')
    }
    e.stopPropagation()
  }, [text])
  return <div className={classList("Prompt", focus && 'active')}>
    <input placeholder='Say something, or execute a /command' tabIndex={0} // display
      value={text} onChange={e => setText(e.target.value)} onKeyPress={handleKeyPress} // input
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} autoFocus ref={input} // focus
    />
  </div>
}