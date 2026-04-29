"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { GripVertical } from "lucide-react"
import { useCallback, useRef } from "react"

const DEFAULT_IMAGE_WIDTH = "100%"
type ImageAlign = "left" | "center" | "right"

export function ImageWithCaptionNodeView(props: NodeViewProps) {
  const { editor, getPos, node, updateAttributes, selected } = props
  const { src, alt, title } = node.attrs as {
    src: string
    alt?: string
    title?: string
    textAlign?: ImageAlign
    width?: number | string | null
  }
  const imageAlign = node.attrs.textAlign || "center"
  const imageWidth = node.attrs.width || DEFAULT_IMAGE_WIDTH
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleAltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ alt: e.target.value })
    },
    [updateAttributes]
  )

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    inputRef.current?.focus()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const pos = getPos()
    if (typeof pos === "number") {
      editor.chain().focus().setNodeSelection(pos).run()
    }
  }

  const setImageAlign = (align: ImageAlign) => {
    const nextAttributes: { textAlign: ImageAlign; width?: string } = {
      textAlign: align,
    }

    if (!node.attrs.width || node.attrs.width === "100%") {
      nextAttributes.width = DEFAULT_IMAGE_WIDTH
    }

    updateAttributes(nextAttributes)

    const pos = getPos()
    if (typeof pos === "number") {
      editor.chain().focus().setNodeSelection(pos).run()
    }
  }

  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    direction: "left" | "right"
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const wrapper = wrapperRef.current
    const editorElement = editor.view.dom as HTMLElement
    if (!wrapper || !editorElement) return

    const startX = e.clientX
    const startWidth = wrapper.getBoundingClientRect().width
    const editorWidth = editorElement.getBoundingClientRect().width
    const maxWidth = editorWidth
    const minWidth = Math.min(160, maxWidth)

    const resizeImage = (event: PointerEvent) => {
      const delta = event.clientX - startX
      const nextWidth =
        direction === "right" ? startWidth + delta : startWidth - delta
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, nextWidth))

      updateAttributes({ width: Math.round(clampedWidth) })
    }

    const stopResize = () => {
      window.removeEventListener("pointermove", resizeImage)
      window.removeEventListener("pointerup", stopResize)
    }

    window.addEventListener("pointermove", resizeImage)
    window.addEventListener("pointerup", stopResize)
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="image-with-caption-wrapper"
      data-align={imageAlign}
      style={{
        width:
          typeof imageWidth === "number" ? `${imageWidth}px` : imageWidth,
      }}
      draggable={true}
    >
      <div
        className={`image-with-caption-img-container ${
          selected ? "image-selected" : ""
        }`}
        data-drag-handle
        draggable={true}
        onClick={handleImageClick}
        title="Drag to reposition image"
      >
        <div
          className="image-with-caption-drag-handle"
          data-drag-handle
          aria-label="Drag image to reposition"
          title="Drag image to reposition"
        >
          <GripVertical aria-hidden="true" size={18} />
        </div>
        {selected && (
          <>
            <button
              type="button"
              className="image-with-caption-resize-handle image-with-caption-resize-handle-left"
              aria-label="Resize image from left"
              onPointerDown={(e) => handleResizePointerDown(e, "left")}
            />
            <button
              type="button"
              className="image-with-caption-resize-handle image-with-caption-resize-handle-right"
              aria-label="Resize image from right"
              onPointerDown={(e) => handleResizePointerDown(e, "right")}
            />
          </>
        )}
        <img
          src={src}
          alt={alt || ""}
          title={title || ""}
          className="image-with-caption-img"
          draggable={false}
        />
      </div>

      <div className="image-with-caption-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="image-with-caption-input"
          placeholder="Add alt text / caption..."
          value={alt || ""}
          onChange={handleAltChange}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          aria-label="Image alt text"
        />
      </div>
    </NodeViewWrapper>
  )
}