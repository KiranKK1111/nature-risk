import { useRef, useState, useCallback, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface Anchor {
  right: number;
  top?: number;
  bottom?: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
}

const DRAG_THRESHOLD = 3;

export function useDraggable(options: UseDraggableOptions = {}) {
  const { initialPosition } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(initialPosition ?? null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const hasDraggedOnce = useRef(false);
  const savedAnchor = useRef<Anchor | null>(null);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const offset = useRef<Position>({ x: 0, y: 0 });
  const initialLeft = useRef(0);
  const initialTop = useRef(0);

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
    initialLeft.current = currentLeft;
    initialTop.current = currentTop;
    dragging.current = true;
    didDrag.current = false;
    // Don't setPosition here — wait for actual mouse movement
  }, []);

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

      // Only start dragging after threshold
      if (!didDrag.current) {
        if (Math.abs(dx) + Math.abs(dy) <= DRAG_THRESHOLD) return;
        didDrag.current = true;
        hasDraggedOnce.current = true;
        // Set initial position on first real drag movement
        setPosition({ x: initialLeft.current, y: initialTop.current });
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

  /** Save position as right-edge anchor, then snap to CSS default */
  const parkToCorner = useCallback((anchorBottom?: boolean) => {
    if (hasDraggedOnce.current && position) {
      const el = elementRef.current;
      const container = el?.offsetParent as HTMLElement;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const rightOffset = containerRect.width - position.x - elRect.width;
        if (anchorBottom) {
          const bottomOffset = containerRect.height - position.y - elRect.height;
          savedAnchor.current = { right: rightOffset, bottom: bottomOffset };
        } else {
          savedAnchor.current = { right: rightOffset, top: position.y };
        }
      }
    }
    setPosition(null);
  }, [position]);

  /** Restore saved anchor, resolving to left/top from right edge */
  const restorePosition = useCallback((anchorBottom?: boolean) => {
    if (!savedAnchor.current) return;
    const el = elementRef.current;
    const container = el?.offsetParent as HTMLElement;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    requestAnimationFrame(() => {
      const elRect = el.getBoundingClientRect();
      const anchor = savedAnchor.current!;
      const left = containerRect.width - anchor.right - elRect.width;
      let top: number;
      if (anchorBottom && anchor.bottom != null) {
        top = containerRect.height - anchor.bottom - elRect.height;
      } else {
        top = anchor.top ?? 16;
      }
      setPosition({
        x: Math.max(0, left),
        y: Math.max(0, top),
      });
    });
  }, []);

  const positionStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : {};

  return { elementRef, positionStyle, onMouseDown, onClickCapture, parkToCorner, restorePosition };
}
