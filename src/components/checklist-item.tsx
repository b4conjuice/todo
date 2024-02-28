import { useState } from 'react'
import classnames from 'classnames'
import {
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

import { type Item } from '@/utils/types'

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

          <button type='button' onClick={() => setConfirmDelete(false)}>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </>
      ) : (
        <button type='button' {...props} onClick={() => setConfirmDelete(true)}>
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
  toggleCheck?: () => void
  editItem?: (name: string) => void
  deleteItem?: () => void
}) => {
  const { name, checked } = item
  return (
    <>
      <input
        className='bg-cb-dark-blue disabled:pointer-events-none disabled:opacity-25'
        type='checkbox'
        checked={checked}
        onChange={toggleCheck}
        readOnly={!toggleCheck}
        disabled={!toggleCheck}
      />
      {editItem ? (
        <input
          // ref={ref}
          className={classnames(
            checked
              ? 'line-through disabled:pointer-events-none disabled:opacity-25'
              : '',
            'grow border-none bg-transparent'
          )}
          readOnly={checked || !editItem}
          disabled={checked || !editItem}
          type='text'
          name='item'
          value={name}
          onChange={e => {
            if (editItem) editItem(e.target.value)
          }}
        />
      ) : (
        <span
          className={classnames(
            checked ? 'line-through opacity-25' : '',
            'grow px-3 py-2'
          )}
        >
          {name}
        </span>
      )}

      {deleteItem && (
        <Delete handleDelete={deleteItem}>
          <TrashIcon className='h-6 w-6' />
        </Delete>
      )}
    </>
  )
}

export default ChecklistItem
