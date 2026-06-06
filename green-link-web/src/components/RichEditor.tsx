import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichEditorProps {
  defaultValue?: string
  onChange: (html: string) => void
  minHeight?: number
  readOnly?: boolean
}

/**
 * Quill v2 wrapper. Use `key` prop from parent to force full remount when
 * switching between different articles.
 */
export function RichEditor({ defaultValue = '', onChange, minHeight = 360, readOnly = false }: RichEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // Create inner mount target so cleanup just clears innerHTML
    const editorEl = document.createElement('div')
    wrapper.appendChild(editorEl)

    const quill = new Quill(editorEl, {
      theme: 'snow',
      readOnly,
      modules: {
        toolbar: readOnly
          ? false
          : [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: [] }],
              [{ color: [] }, { background: [] }],
              ['link', 'image'],
              ['clean'],
            ],
      },
    })

    if (defaultValue) {
      const delta = quill.clipboard.convert({ html: defaultValue })
      quill.setContents(delta, 'silent')
    }

    quill.on('text-change', () => {
      onChangeRef.current(quill.getSemanticHTML())
    })

    return () => {
      quill.off('text-change')
      wrapper.innerHTML = ''
    }
  }, [readOnly]) // defaultValue intentionally omitted — controlled by key remount

  return (
    <div
      ref={wrapperRef}
      className="rich-editor-wrapper overflow-hidden rounded-lg border border-gray-200"
      style={{ minHeight }}
    />
  )
}
