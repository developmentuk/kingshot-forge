import lockfile from '../package-lock.json' with { type: 'json' }

export default function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store')
  response.status(200).json(lockfile)
}
