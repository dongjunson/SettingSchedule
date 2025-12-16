import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/utils"

const PopoverContext = React.createContext({ open: false, onOpenChange: () => {} })

const Popover = ({ open, onOpenChange, children }) => {
  const containerRef = React.useRef(null)
  const triggerRef = React.useRef(null)

  return (
    <PopoverContext.Provider value={{ open, onOpenChange, containerRef, triggerRef }}>
      <div ref={containerRef} className="relative z-10">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { open, onOpenChange })
          }
          return child
        })}
      </div>
    </PopoverContext.Provider>
  )
}
Popover.displayName = "Popover"

const PopoverTrigger = React.forwardRef(({ className, asChild = false, children, open, onOpenChange, ...props }, ref) => {
  const { triggerRef } = React.useContext(PopoverContext)
  const internalRef = React.useRef(null)
  const combinedRef = React.useCallback((node) => {
    internalRef.current = node
    triggerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref, triggerRef])

  const handleClick = (e) => {
    e.stopPropagation()
    onOpenChange?.(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
      ref: combinedRef,
    })
  }

  return (
    <div
      ref={combinedRef}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ className, align = "start", sideOffset = 8, matchTriggerWidth = false, children, open, onOpenChange, ...props }, ref) => {
  const contentRef = React.useRef(null)
  const [position, setPosition] = React.useState({ top: -9999, left: -9999, width: null })
  const [isPositioned, setIsPositioned] = React.useState(false)
  const { containerRef, triggerRef } = React.useContext(PopoverContext)

  const updatePosition = React.useCallback(() => {
    // triggerRef를 직접 찾기 (fallback)
    let trigger = triggerRef?.current
    if (!trigger && containerRef?.current) {
      trigger = containerRef.current.querySelector('[data-popover-trigger]')
    }

    if (!trigger || !contentRef.current) return false

    const triggerRect = trigger.getBoundingClientRect()

    // 화면 크기
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 콘텐츠 크기 측정 (실제 렌더링된 크기 또는 기본값)
    const contentWidth = matchTriggerWidth ? triggerRect.width : (contentRef.current.offsetWidth || 280)
    const contentHeight = contentRef.current.offsetHeight || 350

    // 콘텐츠 높이가 아직 측정되지 않았으면 false 반환
    if (contentRef.current.offsetHeight === 0) return false

    // 좌우 위치 계산 (fixed 이므로 scroll offset 불필요)
    let left = triggerRect.left
    if (align === "center") {
      left = triggerRect.left + (triggerRect.width - contentWidth) / 2
    } else if (align === "end") {
      left = triggerRect.left + triggerRect.width - contentWidth
    }

    // 화면 경계 확인 및 조정 (좌우)
    const padding = 8
    if (left < padding) {
      left = padding
    } else if (left + contentWidth > viewportWidth - padding) {
      left = viewportWidth - contentWidth - padding
    }

    // 상하 위치 계산 (하단에 공간이 부족하면 위쪽에 표시)
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    let top
    if (spaceBelow >= contentHeight + sideOffset) {
      // 하단에 충분한 공간이 있으면 아래에 표시
      top = triggerRect.bottom + sideOffset
    } else if (spaceAbove >= contentHeight + sideOffset) {
      // 상단에 충분한 공간이 있으면 위에 표시
      top = triggerRect.top - contentHeight - sideOffset
    } else {
      // 양쪽 모두 공간이 부족하면 가능한 곳에 표시
      if (spaceBelow > spaceAbove) {
        // 하단이 더 나으면 하단에 (일부가 잘릴 수 있음)
        top = triggerRect.bottom + sideOffset
      } else {
        // 상단이 더 나으면 상단에
        top = Math.max(padding, triggerRect.top - contentHeight - sideOffset)
      }
    }

    setPosition({ top, left, width: matchTriggerWidth ? triggerRect.width : null })
    setIsPositioned(true)
    return true
  }, [align, sideOffset, triggerRef, containerRef, matchTriggerWidth])

  React.useEffect(() => {
    if (open) {
      // 초기화
      setIsPositioned(false)
      setPosition({ top: -9999, left: -9999 })

      // 여러 번 시도하여 높이가 측정될 때까지 대기
      let attemptCount = 0
      const maxAttempts = 30

      const attemptUpdate = () => {
        const success = updatePosition()
        if (!success && attemptCount < maxAttempts) {
          attemptCount++
          requestAnimationFrame(attemptUpdate)
        }
      }

      // 다음 프레임에서 시작
      requestAnimationFrame(attemptUpdate)
    } else {
      setIsPositioned(false)
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        const trigger = event.target.closest('[data-popover-trigger]')
        const container = containerRef?.current
        // trigger가 현재 Popover의 자식인지 확인
        if (!trigger || (container && !container.contains(trigger))) {
          onOpenChange?.(false)
        }
      }
    }

    const handleScroll = () => {
      if (open) {
        updatePosition()
      }
    }

    const handleResize = () => {
      if (open) {
        updatePosition()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [open, onOpenChange, containerRef, updatePosition])

  if (!open) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-[9999] rounded-md border bg-white shadow-xl transition-opacity duration-100",
        !isPositioned && "opacity-0 pointer-events-none",
        isPositioned && "opacity-100",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        ...(position.width ? { width: `${position.width}px` } : { minWidth: '280px' })
      }}
      {...props}
    >
      {children}
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
