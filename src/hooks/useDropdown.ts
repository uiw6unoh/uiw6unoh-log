import React, { useCallback, useEffect, useRef, useState } from 'react'

type useDropdownType = () => [
  React.RefObject<HTMLDivElement>,
  boolean,
  () => void
]

function assertIsNode(e: EventTarget | null): asserts e is Node {
  if (!e || !('nodeType' in e)) {
    throw new Error(`Node expected`)
  }
}

const useDropdown: useDropdownType = () => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [isDropdownOpened, setIsDropdownOpened] = useState(false)

  const handleClick = useCallback((e: MouseEvent) => {
    if (!menuRef.current) return
    assertIsNode(e.target)
    if (!menuRef.current.contains(e.target)) {
      setIsDropdownOpened(false)
    }
  }, [])

  useEffect(() => {
    if (isDropdownOpened) {
      window.addEventListener('click', handleClick)
    }
    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [isDropdownOpened, handleClick])

  const onOpenBtn = () => {
    setIsDropdownOpened(true)
  }

  return [menuRef, isDropdownOpened, onOpenBtn]
}

export default useDropdown
