import type { VercelRequest, VercelResponse } from "@vercel/node"
import { handlePublicPlayerRequest } from "../../server/player-identity/http.js"
import { productionPlayerIdentityRuntime } from "../../server/player-identity/runtime.js"

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await handlePublicPlayerRequest(productionPlayerIdentityRuntime, request, response)
}
