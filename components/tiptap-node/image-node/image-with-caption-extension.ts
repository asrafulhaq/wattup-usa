import { Image as TiptapImage } from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageWithCaptionNodeView } from "./image-with-caption-node"

export const ImageWithCaption = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: "center",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-text-align") || "center",
        renderHTML: (attributes: Record<string, unknown>) => {
          const textAlign = attributes.textAlign as string | undefined
          if (!textAlign || textAlign === "center") return {}
          return { "data-text-align": textAlign }
        },
      },
      alt: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("alt") || "",
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.alt) return {}
          return { alt: attributes.alt }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageWithCaptionNodeView)
  },
})

export default ImageWithCaption