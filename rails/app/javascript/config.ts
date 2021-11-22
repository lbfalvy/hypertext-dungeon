import { authService, TokenPair } from "./services/authService";
import { storageService } from "./services/storageService";

export const auth = authService({
    refreshEndpoint: '/api/v1/session/refresh',
    renewOnTtl: 10,
    lockExpiry: 1,
    storage: storageService('auth_state')
})