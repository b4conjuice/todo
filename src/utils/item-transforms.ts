import { type Item } from '@/utils/types'

export const bodyToItems = (body: string) =>
  body.split('\n').map(item => {
    const [name, checked] = item.split('\t')
    return {
      name: name ?? '',
      checked: checked === 'x',
    }
  })

export const itemsToBody = (items: Item[]) =>
  items
    .map(item => {
      const { name, checked } = item
      return `${name}\t${checked ? 'x' : 'o'}`
    })
    .join('\n')
