import { type Item } from '@/utils/types'

export default function getDuplicates(items: Item[]) {
  return Object.entries(
    items.reduce((list: Record<string, number>, item: Item) => {
      const { name } = item

      if (list[name]) list[name] += 1
      else list[name] = 1

      return list
    }, {})
  ).reduce((list: string[], entry) => {
    const [key, value] = entry

    if (value > 1) list.push(key)

    return list
  }, [])
}
