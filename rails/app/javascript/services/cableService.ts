import { event, Subscribe, Variable } from "@lbfalvy/mini-events";
import { Channel } from "@rails/actioncable";
import createConsumer from "../helpers/createConsumer";

export interface CableService {
  subscribe: Subscribe<[any]>,
  dispose: () => void
  // onConnection: Subscribe<[Subscribe<[any]> | void]>
}

export interface CableOptions {
  token: Variable<string>
  url: string
  log?: (...args: any[]) => void
}

interface ChannelMixin {
  received?(msg: string): void
}

export function cableService({ token, url, log }: CableOptions): CableService {
  log?.('Initiating connection to', url)
  const [emit, subscribe] = event<any>()
  if (log) subscribe(m => log('received', m))
  const consumer = createConsumer()
  const subscriptions = new Map<string, Channel & ChannelMixin>()
  function subscribeWithToken(token: string) {
    const sub = consumer.subscriptions.create<ChannelMixin>({ channel: 'MainChannel', token }, {
      received(msg) {
        const data = JSON.parse(msg)
        if ('expired' in data) {
          sub.unsubscribe()
          subscriptions.delete(token)
          sub.received = undefined
        } else emit(data)
      }
    })
    log?.('Subscription object for token', sub, token)
    subscriptions.set(token, sub)
  }
  subscribeWithToken(token.get())
  const dispose = token.changed(token => {
    log?.('refreshing token to', token)
    subscriptions.forEach(c => {
      c.unsubscribe()
      c.received = undefined
    })
    subscriptions.clear()
    subscribeWithToken(token)
  })
  return {
    subscribe,
    dispose: () => {
      log?.('disponsing of service')
      subscriptions.forEach(c => c.unsubscribe())
      consumer.disconnect()
      dispose()
    }
  }
}