import { Consumer } from "@rails/actioncable";
// @ts-ignore
import ActionCable from 'actioncable-jwt';

/**
 * Shim that uses "actioncable-jwt" with the typings of "@rails/actioncable"
 * @param url URL for the websocket endpoint. By default the path should be /cable
 * @param jwt API key
 * @returns An object that complies with the ActionCable consumer interface
 */
export default function createConsumer(url: string, jwt: string): Consumer {
    return ActionCable.createConsumer(url, jwt)
}