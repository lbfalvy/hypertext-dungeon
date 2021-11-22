import { Subscribe } from "@lbfalvy/mini-events";

interface CableService {
    subscribe(to: { channel: string } & Record<string, any>): [
        (message: Record<string, any>) => void,
        Subscribe<[any]>
    ]
}