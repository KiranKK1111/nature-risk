import { useRef, useState, useCallback, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Initial position relative to the container */
  initialPosition?: Position;
}

const DRAG_THRESHOLD = 3; // px — ignore tiny accidental moves

/**
 * Hook that makes an absolutely-positioned element draggable within its
 * nearest positioned ancestor (the container).
 *
 * Returns a ref to attach to the draggable element, the current position
 * style, and a drag-handle onMouseDown handler.
 *
 * Use `onClickCapture` with the returned handler to prevent click events
 * from firing after a real drag.
 */
export function useDraggable(options: UseDraggableOptions = {}) {
  const { initialPosition } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(initialPosition ?? null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const offset = useRef<Position>({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const container = el.offsetParent as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const currentLeft = rect.left - containerRect.left;
    const currentTop = rect.top - containerRect.top;

    offset.current = { x: e.clientX - currentLeft, y: e.clientY - currentTop };
    startPos.current = { x: e.clientX, y: e.clientY };
    dragging.current = true;
    didDrag.current = false;

    setPosition({ x: currentLeft, y: currentTop });
  }, []);

  /** Attach to onClickCapture on the drag handle to suppress click after drag */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) {
      e.stopPropagation();
      e.preventDefault();
      didDrag.current = false;
    }
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const el = elementRef.current;
      if (!el) return;

      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (!didDrag.current && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
        didDrag.current = true;
      }

      const container = el.offsetParent as HTMLElement;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      let newX = e.clientX - offset.current.x;
      let newY = e.clientY - offset.current.y;

      const maxX = containerRect.width - elRect.width;
      const maxY = containerRect.height - elRect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const positionStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : {};

  return { elementRef, positionStyle, onMouseDown, onClickCapture };
}
