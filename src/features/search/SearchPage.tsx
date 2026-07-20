import { useSearchParams } from 'react-router-dom'
import { SearchExperience } from './SearchExperience'

export default function SearchPage() {
  const [params] = useSearchParams()
  return <SearchExperience initialQuery={params.get('q') ?? ''} embedded />
}

