import { useCallback, useRef } from "react";
import type { DragItem } from "./types";

interface DragState {
  item: DragItem | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  dragElement: HTMLElement | null;
  isDragging: boolean;
}

export function useDragAndDrop(
  onDrop: (item: DragItem, targetType: string, targetIndex: number) => void,
) {
  const dragState = useRef<DragState>({
    item: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    dragElement: null,
    isDragging: false,
  });

  const getDropTarget = useCallback(
    (x: number, y: number): { type: string; index: number } | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        const dropZone = (el as HTMLElement).closest(
          "[data-drop-type]",
        ) as HTMLElement | null;
        if (dropZone) {
          return {
            type: dropZone.dataset.dropType!,
            index: parseInt(dropZone.dataset.dropIndex || "0", 10),
          };
        }
      }
      return null;
    },
    [],
  );

  const handleMoveEvent = useCallback((clientX: number, clientY: number) => {
    const state = dragState.current;
    if (!state.isDragging || !state.dragElement) return;
    const dx = clientX - state.startX;
    const dy = clientY - state.startY;
    state.dragElement.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);

  const handleEndEvent = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragState.current;
      if (!state.isDragging || !state.dragElement) return;

      state.dragElement.style.transform = "";
      state.dragElement.style.zIndex = "";
      state.dragElement.classList.remove("dragging");
      state.isDragging = false;

      const target = getDropTarget(clientX, clientY);
      if (target && state.item) {
        onDrop(state.item, target.type, target.index);
      }

      state.item = null;
      state.dragElement = null;
    },
    [onDrop, getDropTarget],
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      item: DragItem,
      element: HTMLElement,
    ) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const state = dragState.current;
      state.item = item;
      state.startX = clientX;
      state.startY = clientY;
      state.dragElement = element;
      state.isDragging = true;
      element.classList.add("dragging");
      element.style.zIndex = "1000";

      const onMouseMove = (ev: MouseEvent) =>
        handleMoveEvent(ev.clientX, ev.clientY);
      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        handleMoveEvent(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      const onMouseUp = (ev: MouseEvent) => {
        handleEndEvent(ev.clientX, ev.clientY);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      const onTouchEnd = (ev: TouchEvent) => {
        const touch = ev.changedTouches[0];
        handleEndEvent(touch.clientX, touch.clientY);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      if ("touches" in e) {
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
      } else {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }
    },
    [handleMoveEvent, handleEndEvent],
  );

  return { startDrag };
}
