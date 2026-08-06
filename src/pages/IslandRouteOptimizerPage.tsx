import { Link } from 'react-router-dom'
import IslandRouteOptimizer from '../features/island-route/IslandRouteOptimizer.js'

export default function IslandRouteOptimizerPage() {
  return <main className="island-route-page">
    <Link className="buildings-back" to="/companion">← Companion index</Link>
    <IslandRouteOptimizer />
  </main>
}
