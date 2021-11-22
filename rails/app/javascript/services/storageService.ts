import { event, Subscribe, Variable } from "@lbfalvy/mini-events"

const keys = new Set<string>()

const onFreeFor = (key: string, onStorage: (e: StorageEvent) => void) => () => {
    keys.delete(key)
    window.removeEventListener('storage', onStorage)
}


function decodeNullable<T>(s: string|undefined|null): T {
    return s ? JSON.parse(s) : undefined
}

/**
 * An interface for LocalStorage with change detection for
 * effective cross-tab state synchronization
 * @param key LocalStorage key to be used for this data
 * @returns Interface to get and set the data
 */
export function storageService<T>(key: string): Variable<T> {
    if (keys.has(key)) throw new Error('Key already in use')
    keys.add(key)
    const [emit, subscribe] = event<T, T>()
    function onStorage(e: StorageEvent) {
        if (e.key != key) return
        emit(decodeNullable(e.newValue), decodeNullable(e.oldValue))
    }
    window.addEventListener('storage', onStorage)
    const srv: Variable<T> = [
        function set(data) {
            if (!data) localStorage.removeItem(key)
            else localStorage.setItem(key, JSON.stringify(data))
        },
        () => decodeNullable(localStorage.getItem(key)),
        subscribe
    ]
    new FinalizationRegistry<void>(onFreeFor(key, onStorage)).register(srv)
    return srv
}