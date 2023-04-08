import { useState, useRef } from 'react'
import Fuse from 'fuse.js'

import { type Item } from '@/utils/types'

const useSearch = ({
  list,
  options,
}: {
  list: Item[]
  options: Record<string, string[]>
}) => {
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [search, setSearch] = useState('')

  const fuse = new Fuse(list, options)

  const results =
    search === '' ? list : fuse.search(search).map(result => result.item)

  return { search, setSearch, results, searchRef }
}

export default useSearch
