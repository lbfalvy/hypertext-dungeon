import { AuthService } from "../services/authService";

export async function withToken<T>(auth: AuthService, fn: (token: string) => T | Promise<T>): Promise<T> {
  const readyToken = auth.getToken()
  // onToken will never yield null when getToken returned null on the last invocation
  const token = readyToken ?? await new Promise(res => auth.onToken(res, true, true))
  return fn(token!)
}