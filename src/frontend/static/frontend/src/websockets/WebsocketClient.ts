import { WebsocketConfig } from '../utils/interfaces'
import WebsocketClient from '@gamestdio/websocket'
import { debounce } from 'lodash'

declare const usingHTTPS: boolean

/** Websocket message from backend structure */
type WebsocketMessage = { command: string }

/**
 * Handles websocket connections
 */
class WebsocketClientCustom {
    private websocket: WebSocket

    constructor (config: WebsocketConfig) {
        const protocol = usingHTTPS ? 'wss' : 'ws'
        const url = `${protocol}://${window.location.host}${config.channelUrl}`

        this.websocket = new WebsocketClient(url, [], { backoff: 'fibonacci' })

        this.websocket.onopen = function () {
            console.log('Websocket connection established')
        }
        // Makes all the functions debounced to prevent multiple concatenated executions.

        config.commandsToAttend = config.commandsToAttend.map(command => ({ ...command, functionToExecute: debounce(command.functionToExecute, 300) }))

        this.websocket.onmessage = function (event) {
            try {
                const dataParsed: WebsocketMessage = JSON.parse(event.data)

                const commandToAttend = config.commandsToAttend.find((commandToAttend) => commandToAttend.key === dataParsed.command)

                // If matches with any function defined by the user, executes it

                if (commandToAttend !== undefined) {
                    commandToAttend.functionToExecute()
                }
            } catch (ex) {
                console.log('Could not parse data in JSON format')
                console.log('Data:', event.data)
                console.log('Exception:', ex)
            }
        }

        this.websocket.onerror = function (event) {
            console.log('Error establishing websocket connection', event)
            console.log('Reconnecting')
        }

        this.websocket.onclose = function (event) {
            console.log('Closing websocket connection', event)
            console.log('Reconnecting')
        }

        // If it's connected before the assignment of the 'onopen' function
        // calls it manually
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.onopen(null as any)
        }
    }
}

export { WebsocketClientCustom }
