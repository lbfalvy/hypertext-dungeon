import { Subscribe } from '@lbfalvy/mini-events'

interface ChatService {
    getLog(): [string, string][]
    sendMessage(msg: string): void
    message: Subscribe<[string, string]>
}

function chatService()