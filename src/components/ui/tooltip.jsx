import * as React from 'react';
import { cn } from '../../lib/utils';

const TooltipContext = React.createContext({ open: false });

const Tooltip = ({ children, delayDuration = 300 }) => {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open }}>
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { open });
          }
          return child;
        })}
      </div>
    </TooltipContext.Provider>
  );
};
Tooltip.displayName = 'Tooltip';

const TooltipTrigger = React.forwardRef(
  ({ className, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
      });
    }

    return (
      <div ref={ref} className={cn('inline-block', className)} {...props}>
        {children}
      </div>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef(
  (
    { className, side = 'top', align = 'center', sideOffset = 8, children, open, ...props },
    ref
  ) => {
    const contentRef = React.useRef(null);
    const [position, setPosition] = React.useState({ top: -9999, left: -9999 });
    const [isPositioned, setIsPositioned] = React.useState(false);

    const updatePosition = React.useCallback(() => {
      const trigger = contentRef.current?.parentElement?.querySelector('[data-tooltip-trigger]');
      if (!trigger || !contentRef.current) return false;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      let top = 0;
      let left = 0;

      // 세로 위치 계산
      if (side === 'top') {
        top = triggerRect.top - contentRect.height - sideOffset;
      } else if (side === 'bottom') {
        top = triggerRect.bottom + sideOffset;
      } else if (side === 'left') {
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      } else if (side === 'right') {
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      }

      // 가로 위치 계산
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') {
          left = triggerRect.left;
        } else if (align === 'end') {
          left = triggerRect.left + triggerRect.width - contentRect.width;
        } else {
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        }
      }
      if (side === 'left') {
        left = triggerRect.left - contentRect.width - sideOffset;
      }
      if (side === 'right') {
        left = triggerRect.right + sideOffset;
      }

      // 화면 경계 확인 및 조정
      if (left < padding) left = padding;
      if (left + contentRect.width > viewportWidth - padding) {
        left = viewportWidth - contentRect.width - padding;
      }
      if (top < padding) top = padding;
      if (top + contentRect.height > viewportHeight - padding) {
        top = viewportHeight - contentRect.height - padding;
      }

      setPosition({ top, left });
      setIsPositioned(true);
      return true;
    }, [side, align, sideOffset]);

    React.useEffect(() => {
      if (!open) {
        setIsPositioned(false);
        return;
      }

      // 약간의 지연 후 위치 계산 (렌더링 완료 후)
      const timer = setTimeout(() => {
        if (updatePosition()) {
          setIsPositioned(true);
        }
      }, 10);

      const handleResize = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }, [open, updatePosition]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'fixed z-[9999] rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
          'pointer-events-none',
          !isPositioned && 'opacity-0',
          isPositioned && 'opacity-100 transition-opacity duration-200',
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent };
