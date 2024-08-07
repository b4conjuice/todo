import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import { type Note } from '@prisma/client'
import {
  ArrowDownOnSquareIcon,
  ArrowsUpDownIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import {
  Footer,
  Loading,
  Main,
  FooterListItem,
  DragDropList,
} from '@bacondotbuild/ui'
import { useDebounce } from '@uidotdev/usehooks'

import Layout from '@/components/layout'
import ChecklistItem from '@/components/checklist-item'
import { api } from '@/utils/api'
import useSearch from '@/utils/useSearch'
import { type Item } from '@/utils/types'
import { itemsToBody, bodyToItems } from '@/utils/item-transforms'
import getDuplicates from '@/utils/getDuplicates'

function CheckList({ note }: { note: Note }) {
  const utils = api.useContext()
  const { mutate: updateNote } = api.notes.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newNote) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notes.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.notes.get.getData()

      // Optimistically update the data with our new post
      utils.notes.get.setData({ id: note.id }, () => newNote as Note)

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.notes.get.setData({ id: note.id }, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.notes.get.invalidate()
    },
  })

  const [editListOrder, setEditListOrder] = useState(false)
  const [items, setItems] = useState(bodyToItems(note?.body ?? ''))
  const debouncedItems = useDebounce(items, 500)
  const title = (note?.title ?? '').replace('= ', '')

  useEffect(() => {
    function syncNote() {
      const newBody = itemsToBody(items)
      const newNote = {
        ...note,
        text: `${note?.title ?? ''}\n\n${newBody}`,
        body: newBody,
        author: note?.author ?? '',
      }
      updateNote(newNote)
    }

    syncNote()
  }, [debouncedItems])
  const sortByChecked = ({ checked: b }: Item, { checked: a }: Item) =>
    b === a ? 0 : b ? 1 : -1
  const updateItems = (newItems: Item[]) => {
    const sortedItems = [...newItems].sort(sortByChecked)
    setItems(sortedItems)
  }

  const { search, setSearch, results, searchRef } = useSearch({
    list: items || [],

    options: {
      keys: ['name'],
    },
  })

  const duplicates = getDuplicates(items)

  const addItem = () => {
    const newItems = [
      { name: '', checked: false },
      ...items.map(({ name, checked }) => ({ name, checked })),
    ]
    updateItems(newItems)
  }

  const isDuplicate = (name: string) =>
    duplicates.some(duplicate => duplicate === name)

  const unsavedChanges = note && itemsToBody(items) !== note?.body
  return (
    <Layout title={title}>
      <Main className='flex flex-col px-4'>
        <div className='flex flex-grow flex-col items-center space-y-4'>
          <div className='flex w-full'>
            <input
              ref={searchRef}
              className='grow bg-cb-dark-blue'
              type='text'
              placeholder='search'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                const { key } = e
                if (key === 'Escape') {
                  setSearch('')
                }
              }}
            />
            {search !== '' && (
              <button
                type='button'
                disabled={search === ''}
                onClick={() => setSearch('')}
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            )}
          </div>
          {editListOrder ? (
            <DragDropList
              items={items.map((item, index) => ({
                ...item,
                id: `${item.name}-${index}`,
              }))}
              renderItem={item => (
                <div
                  className={classnames(
                    'flex items-center gap-4 bg-cobalt px-4',
                    isDuplicate(item.name) && 'border-l-4 border-cb-pink'
                  )}
                >
                  <ChecklistItem item={item} />
                  <ArrowsUpDownIcon className='h-6 w-6' />
                </div>
              )}
              setItems={updateItems}
              listContainerClassName='space-y-4 w-full'
            />
          ) : (
            <ul className='w-full space-y-4'>
              {(search !== '' && results.length > 0 ? results : items).map(
                (item, index) => (
                  <li
                    key={index}
                    className={classnames(
                      'flex items-center gap-4 bg-cobalt px-4',
                      isDuplicate(item.name) && 'border-l-4 border-cb-pink'
                    )}
                  >
                    <ChecklistItem
                      item={item}
                      toggleCheck={() => {
                        const newItems = [...items]
                        const idx = newItems.findIndex(
                          i => i.name === item.name
                        )
                        const newChecked = !newItems[idx]?.checked
                        const newItem = newItems[idx]
                        if (newItem) newItem.checked = newChecked
                        updateItems(newItems)
                      }}
                      editItem={(name: string) => {
                        const newItems = [...items]
                        const idx = newItems.findIndex(
                          i => i.name === item.name
                        )
                        const newItem = newItems[idx]
                        if (newItem) newItem.name = name
                        updateItems(newItems)
                      }}
                      deleteItem={() => {
                        const newItems = [...items]
                        const idx = newItems.findIndex(
                          i => i.name === item.name
                        )
                        newItems.splice(idx, 1)
                        updateItems(newItems)
                      }}
                    />
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </Main>
      <Footer>
        <FooterListItem
          onClick={() => {
            searchRef?.current?.focus()
          }}
        >
          <MagnifyingGlassIcon className='h-6 w-6' />
        </FooterListItem>
        {editListOrder ? (
          <FooterListItem onClick={() => setEditListOrder(false)}>
            <CheckBadgeIcon className='h-6 w-6' />
          </FooterListItem>
        ) : (
          <FooterListItem onClick={() => setEditListOrder(true)}>
            <ArrowsUpDownIcon className='h-6 w-6' />
          </FooterListItem>
        )}
        <FooterListItem
          onClick={() => {
            addItem()
          }}
        >
          <PlusIcon className='h-6 w-6' />
        </FooterListItem>
        <FooterListItem
          onClick={() => {
            const newBody = itemsToBody(items)
            const newNote = {
              ...note,
              text: `${note?.title ?? ''}\n\n${newBody}`,
              body: newBody,
              author: note?.author ?? '',
            }
            updateNote(newNote)
          }}
          disabled={!unsavedChanges}
        >
          <ArrowDownOnSquareIcon className='h-6 w-6' />
        </FooterListItem>
      </Footer>
    </Layout>
  )
}

export default function CheckListPage() {
  const {
    query: { id },
  } = useRouter()
  const { data: note, isLoading } = api.notes.get.useQuery({ id: id as string })

  if (!note || isLoading)
    return (
      <Layout>
        <Loading />
      </Layout>
    )
  return <CheckList note={note} />
}
