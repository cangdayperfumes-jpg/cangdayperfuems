'use client';

import * as React from 'react';
import { Reorder, useDragControls, type DragControls } from 'framer-motion';

interface DragReorderListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** Receives `dragControls` so the caller can attach a dedicated drag handle
   *  (e.g. a GripVertical icon) via `onPointerDown={(e) => dragControls.start(e)}`
   *  — the item itself is not drag-listening, so inputs/buttons inside a row
   *  stay fully interactive. */
  renderItem: (item: T, index: number, dragControls: DragControls) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  axis?: 'x' | 'y';
}

function DragReorderItem<T>({
  item,
  index,
  itemClassName,
  renderItem,
}: {
  item: T;
  index: number;
  itemClassName?: string;
  renderItem: DragReorderListProps<T>['renderItem'];
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      className={itemClassName}
    >
      {renderItem(item, index, dragControls)}
    </Reorder.Item>
  );
}

export function DragReorderList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  className,
  itemClassName,
  axis = 'y',
}: DragReorderListProps<T>) {
  return (
    <Reorder.Group as="div" axis={axis} values={items} onReorder={onReorder} className={className}>
      {items.map((item, index) => (
        <DragReorderItem
          key={getKey(item)}
          item={item}
          index={index}
          itemClassName={itemClassName}
          renderItem={renderItem}
        />
      ))}
    </Reorder.Group>
  );
}
