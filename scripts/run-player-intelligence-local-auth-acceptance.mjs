import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { platform as currentPlatform } from 'node:os'
import { pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import {
  PLAYER_INTELLIGENCE_ACCEPTANCE,
  assertAuthenticatedAccessToken,
  assertProjectBaseUrl,
  assertProjectRef,
  assertPublishableKey,
  assertRepositoryGate,
  parseArgs,
  projectBaseUrl,
  redact,
  validatePlayerId,
  writeEvidence,
} from './player-intelligence-acceptance-controls.mjs'
import {
  PlayerIntelligenceAcceptanceError,
  runPlayerIntelligenceAcceptance,
} from './run-player-intelligence-authenticated-acceptance.mjs'

export const PLAYER_INTELLIGENCE_LOCAL_AUTH = Object.freeze({
  listenHost: '127.0.0.1',
  redirectHost: 'localhost',
  port: 5173,
  callbackPath: '/player-intelligence-acceptance/callback',
  authTimeoutMs: 3 * 60 * 1000,
})

export class PlayerIntelligenceLocalAuthError extends Error {
  constructor(code, message, result = null) {
    super(message)
    this.name = 'PlayerIntelligenceLocalAuthError'
    this.code = code
    this.result = result
  }
}

export function createMemoryStorage() {
  const values = new Map()
  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
    clear() {
      values.clear()
    },
    size() {
      return values.size
    },
  }
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveLocalAuthEnvironment({
  environment = process.env,
  cwd = process.cwd(),
  loadEnvImpl = loadEnv,
} = {}) {
  const fileEnvironment = loadEnvImpl('development', cwd, '')
  const baseUrl = cleanEnvValue(
    environment.VITE_SUPABASE_URL
      ?? environment.SUPABASE_URL
      ?? fileEnvironment.VITE_SUPABASE_URL
      ?? fileEnvironment.SUPABASE_URL,
  ) || projectBaseUrl().toString()
  const publishableKey = cleanEnvValue(
    environment.SUPABASE_PUBLISHABLE_KEY
      ?? environment.VITE_SUPABASE_PUBLISHABLE_KEY
      ?? fileEnvironment.SUPABASE_PUBLISHABLE_KEY
      ?? fileEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY,
  )

  assertProjectBaseUrl(baseUrl)
  assertPublishableKey(publishableKey, '__pending_local_pkce_access_token__')

  return {
    baseUrl,
    publishableKey,
  }
}

function safePage(title, message) {
  const escapedTitle = String(title).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
  const escapedMessage = String(message).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.55; }
    main { border: 1px solid #aaa; border-radius: 0.75rem; padding: 1.5rem; }
  </style>
</head>
<body>
  <main>
    <h1>${escapedTitle}</h1>
    <p>${escapedMessage}</p>
    <p>You may close this tab and return to PowerShell.</p>
  </main>
</body>
</html>`
}

function respond(res, statusCode, title, message) {
  const body = safePage(title, message)
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body)
}

export function launchSystemBrowser(url, {
  platform = currentPlatform(),
  execFileImpl = execFile,
} = {}) {
  return new Promise((resolve, reject) => {
    let command
    let args
    if (platform === 'win32') {
      command = 'rundll32.exe'
      args = ['url.dll,FileProtocolHandler', url]
    } else if (platform === 'darwin') {
      command = 'open'
      args = [url]
    } else {
      command = 'xdg-open'
      args = [url]
    }
    execFileImpl(command, args, { windowsHide: true }, (error) => {
      if (error) reject(new PlayerIntelligenceLocalAuthError('browser_launch_failed', 'The secure sign-in page could not be opened automatically.'))
      else resolve()
    })
  })
}

function closeServer(server) {
  return new Promise((resolve) => {
    if (!server.listening) return resolve()
    server.close(() => resolve())
  })
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening)
      reject(error)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve(server.address())
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, host)
  })
}

function waitForCallback(register, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new PlayerIntelligenceLocalAuthError('auth_timeout', 'The secure sign-in was not completed before the local acceptance window expired.'))
    }, timeoutMs)
    timeout.unref?.()
    register(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

export async function runPlayerIntelligenceLocalAuthAcceptance({
  args = process.argv.slice(2),
  environment = process.env,
  cwd = process.cwd(),
  createClientImpl = createClient,
  loadEnvImpl = loadEnv,
  browserLauncher = launchSystemBrowser,
  serverFactory = createServer,
  acceptanceRunner = runPlayerIntelligenceAcceptance,
  evidenceWriter = writeEvidence,
  repositoryGate = assertRepositoryGate,
  localAuth = PLAYER_INTELLIGENCE_LOCAL_AUTH,
} = {}) {
  const { flags, value } = parseArgs(args)
  if (!flags.has('--execute') || flags.has('--plan')) {
    throw new PlayerIntelligenceLocalAuthError('execute_required', 'Local authentication acceptance requires the explicit --execute flag. Use the existing plan command for a no-request check.')
  }

  const projectRef = value('--project-ref') ?? PLAYER_INTELLIGENCE_ACCEPTANCE.projectRef
  assertProjectRef(projectRef)
  const playerId = validatePlayerId(value('--player-id'))
  const approvedSha = value('--approved-sha')
  const repository = repositoryGate({ approvedSha, cwd })
  const { baseUrl, publishableKey } = resolveLocalAuthEnvironment({ environment, cwd, loadEnvImpl })
  const storage = createMemoryStorage()
  const supabase = createClientImpl(baseUrl.replace(/\/$/u, ''), publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage,
    },
  })

  const server = serverFactory()
  let callbackResolve
  let callbackReject
  let callbackConsumed = false
  let temporarySessionRevoked = false
  let result = null

  try {
    const address = await listen(server, localAuth.listenHost, localAuth.port)
    const port = typeof address === 'object' && address ? address.port : localAuth.port
    const redirectUrl = `http://${localAuth.redirectHost}:${port}${localAuth.callbackPath}`

    const callbackPromise = waitForCallback((resolve, reject) => {
      callbackResolve = resolve
      callbackReject = reject
    }, localAuth.authTimeoutMs)
    // The browser launcher may await the callback response before this function awaits
    // callbackPromise. Attach a handler now so a fast cancellation cannot become an
    // unhandled rejection; the original promise still rejects when awaited below.
    void callbackPromise.catch(() => {})

    server.on('request', async (req, res) => {
      if (callbackConsumed) {
        respond(res, 409, 'Acceptance already completed', 'This local sign-in callback has already been used.')
        return
      }

      let requestUrl
      try {
        requestUrl = new URL(req.url ?? '/', redirectUrl)
      } catch {
        respond(res, 400, 'Invalid callback', 'The local callback request was invalid.')
        return
      }

      if (req.method !== 'GET' || requestUrl.pathname !== localAuth.callbackPath) {
        respond(res, 404, 'Not found', 'This temporary local server accepts only the approved authentication callback.')
        return
      }

      callbackConsumed = true
      const authError = requestUrl.searchParams.get('error')
      const code = requestUrl.searchParams.get('code')
      if (authError || !code) {
        const error = new PlayerIntelligenceLocalAuthError('authentication_cancelled', 'The temporary Forge sign-in was cancelled or rejected.')
        respond(res, 400, 'Sign-in not completed', error.message)
        callbackReject(error)
        return
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data?.session?.access_token) {
          throw new PlayerIntelligenceLocalAuthError('code_exchange_failed', 'The temporary Forge sign-in code could not be exchanged safely.')
        }
        assertAuthenticatedAccessToken(data.session.access_token)

        try {
          result = await acceptanceRunner({
            args: [
              '--execute',
              '--player-id', playerId,
              '--approved-sha', approvedSha,
              '--project-ref', projectRef,
            ],
            cwd,
            environment: {
              ...environment,
              PLAYER_INTEL_ACCEPTANCE_APPROVED: 'YES',
              PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN: data.session.access_token,
              SUPABASE_PUBLISHABLE_KEY: publishableKey,
            },
            repositoryGate,
          })
        } catch (error) {
          if (error instanceof PlayerIntelligenceAcceptanceError) result = error.acceptanceResult
          throw error
        } finally {
          const signOut = await supabase.auth.signOut({ scope: 'local' })
          temporarySessionRevoked = !signOut.error
          storage.clear()
        }

        if (!temporarySessionRevoked) {
          throw new PlayerIntelligenceLocalAuthError(
            'temporary_session_revoke_failed',
            'The one-call lookup completed, but the temporary sign-in session could not be revoked automatically.',
            result,
          )
        }

        result = {
          ...result,
          authenticationFlow: 'pkce_loopback_memory_only',
          browserSessionPersisted: false,
          credentialsDisplayed: false,
          temporarySessionRevoked: true,
          repository,
        }
        const evidencePath = evidenceWriter(result, environment)
        result = { ...result, evidencePath }
        respond(res, 200, 'Acceptance complete', 'The one-call player acceptance completed and the temporary sign-in session was revoked.')
        callbackResolve(result)
      } catch (cause) {
        try {
          const signOut = await supabase.auth.signOut({ scope: 'local' })
          temporarySessionRevoked = !signOut.error
        } catch {
          temporarySessionRevoked = false
        }
        storage.clear()

        const safeResult = result ? {
          ...result,
          authenticationFlow: 'pkce_loopback_memory_only',
          browserSessionPersisted: false,
          credentialsDisplayed: false,
          temporarySessionRevoked,
          repository,
        } : null
        if (safeResult?.runId) evidenceWriter(safeResult, environment)
        const error = cause instanceof PlayerIntelligenceLocalAuthError || cause instanceof PlayerIntelligenceAcceptanceError
          ? cause
          : new PlayerIntelligenceLocalAuthError('local_auth_acceptance_failed', 'The secure local acceptance flow failed safely.')
        respond(res, 500, 'Acceptance stopped safely', error.message)
        callbackReject(new PlayerIntelligenceLocalAuthError(error.code ?? 'local_auth_acceptance_failed', error.message, safeResult))
      }
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    if (error || !data?.url) {
      throw new PlayerIntelligenceLocalAuthError('oauth_start_failed', 'The temporary Google sign-in could not be started.')
    }

    await browserLauncher(data.url)
    return await callbackPromise
  } finally {
    storage.clear()
    await closeServer(server)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPlayerIntelligenceLocalAuthAcceptance()
    .then((result) => console.log(JSON.stringify(redact(result), null, 2)))
    .catch((error) => {
      console.error(JSON.stringify(redact(error.result ?? {
        status: 'error',
        code: error.code ?? 'local_auth_acceptance_failed',
        message: error instanceof Error ? error.message : 'Local authentication acceptance failed.',
      }), null, 2))
      process.exitCode = 1
    })
}
