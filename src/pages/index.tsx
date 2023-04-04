import { useEffect, useState } from 'react'
import { type NextPage } from 'next'
import classnames from 'classnames'
import { type Note } from '@prisma/client'
import {
  ArrowDownOnSquareIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { Footer, Loading, Main, FooterListItem } from '@bacondotbuild/ui'

import Layout from '@/components/layout'
import { api } from '@/utils/api'

type Item = {
  name: string
  checked: boolean
}

const Delete = ({
  handleDelete,
  isSubmitting,
  children,
  ...props
}: {
  handleDelete: () => void
  isSubmitting?: boolean
  children: React.ReactNode
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      {confirmDelete ? (
        <>
          <button
            className='delete'
            type='button'
            disabled={isSubmitting}
            onClick={() => {
              setConfirmDelete(false)
              handleDelete()
            }}
          >
            {isSubmitting ? (
              <CheckCircleIcon className='h-6 w-6' />
            ) : (
              <CheckCircleIcon className='h-6 w-6' />
            )}
          </button>

          <button
            className='delete-cancel'
            type='button'
            onClick={() => setConfirmDelete(false)}
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </>
      ) : (
        <button
          className='delete'
          type='button'
          {...props}
          onClick={() => setConfirmDelete(true)}
        >
          {children}
        </button>
      )}
    </>
  )
}

const ChecklistItem = ({
  item,
  toggleCheck,
  editItem,
  deleteItem,
}: {
  item: Item
  toggleCheck: () => void
  editItem: (name: string) => void
  deleteItem: () => void
}) => {
  const { name, checked } = item
  return (
    <>
      <input
        type='checkbox'
        checked={checked}
        onChange={toggleCheck}
        readOnly={!toggleCheck}
        className='bg-cb-dark-blue'
      />
      <input
        // ref={ref}
        className={classnames(
          checked
            ? 'line-through disabled:pointer-events-none disabled:opacity-25'
            : '',
          'w-full border-none bg-transparent'
        )}
        readOnly={checked || !editItem}
        disabled={checked || !editItem}
        type='text'
        name='item'
        value={name}
        onChange={e => editItem(e.target.value)}
      />

      {deleteItem && (
        <Delete handleDelete={deleteItem}>
          <TrashIcon className='h-6 w-6' />
        </Delete>
      )}
    </>
  )
}

const bodyToItems = (body: string) =>
  body.split('\n').map(item => {
    const [name, checked] = item.split('\t')
    return {
      name: name ?? '',
      checked: checked === 'x',
    }
  })

const itemsToBody = (items: Item[]) =>
  items
    .map(item => {
      const { name, checked } = item
      return `${name}\t${checked ? 'x' : 'o'}`
    })
    .join('\n')

const Home: NextPage = () => {
  const {
    data: note,
    // refetch,
    // isRefetching,
    isLoading,
  } = api.notes.get.useQuery()

  const utils = api.useContext()
  const { mutate: updateNote } = api.notes.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newNote) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notes.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.notes.get.getData()

      // Optimistically update the data with our new post
      utils.notes.get.setData(undefined, () => newNote as Note)

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.notes.get.setData(undefined, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.notes.get.invalidate()
    },
  })

  const [items, setItems] = useState(bodyToItems((note?.body as string) ?? ''))
  useEffect(() => {
    setItems(bodyToItems((note?.body as string) ?? ''))
  }, [note])

  const sortByChecked = ({ checked: b }: Item, { checked: a }: Item) =>
    b === a ? 0 : b ? 1 : -1
  const updateItems = (newItems: Item[]) => {
    const sortedItems = [...newItems].sort(sortByChecked)
    setItems(sortedItems)
  }

  const addItem = () => {
    const newItems = [
      { name: '', checked: false },
      ...items.map(({ name, checked }) => ({ name, checked })),
    ]
    updateItems(newItems)
  }
  return (
    <Layout>
      <Main className='flex flex-col px-4'>
        <div className='flex flex-grow flex-col items-center space-y-4'>
          <input
            type='text'
            placeholder='search'
            className='w-full bg-cb-dark-blue'
          />
          {isLoading ? (
            <Loading />
          ) : (
            <ul className='w-full space-y-4'>
              {items.map((item, index) => (
                <li
                  key={index}
                  // className={isDuplicate(item.name) ? 'duplicate' : ''}
                  className='flex items-center gap-4 bg-cobalt px-4'
                >
                  <ChecklistItem
                    item={item}
                    toggleCheck={() => {
                      const newItems = [...items]

                      const newChecked = !newItems[index]?.checked
                      const item = newItems[index]
                      if (item) item.checked = newChecked

                      updateItems(newItems)
                    }}
                    editItem={(name: string) => {
                      const newItems = [...items]

                      const item = newItems[index]
                      if (item) item.name = name

                      updateItems(newItems)
                    }}
                    deleteItem={() => {
                      const newItems = [...items]

                      newItems.splice(index, 1)

                      updateItems(newItems)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Main>
      <Footer>
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
          disabled={itemsToBody(items) === note?.body}
        >
          <ArrowDownOnSquareIcon className='h-6 w-6' />
        </FooterListItem>
      </Footer>
    </Layout>
  )
}

export default Home
