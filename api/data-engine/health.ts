export function GET() {
  return Response.json({
    status: 'ok',
    service: 'Forge Data Engine',
    timestamp: new Date().toISOString(),
  })
}