import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichEditorProps {
  defaultValue?: string
  onChange: (html: string) => void
  minHeight?: number
  readOnly?: boolean
  /** If provided, overrides the default base64 image insertion with a MinIO upload. Returns the hosted URL. */
  imageUploadFn?: (file: File) => Promise<string>
}

/**
 * Quill v2 wrapper. Use `key` prop from parent to force full remount when
 * switching between different articles.
 */
export function RichEditor({ defaultValue = '', onChange, minHeight = 360, readOnly = false, imageUploadFn }: RichEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const imageUploadFnRef = useRef(imageUploadFn)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { imageUploadFnRef.current = imageUploadFn }, [imageUploadFn])

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

    // Override default base64 image handler with MinIO upload when imageUploadFn is provided
    if (!readOnly) {
      const toolbar = quill.getModule('toolbar') as
        | { addHandler: (name: string, fn: () => void) => void }
        | undefined
      toolbar?.addHandler('image', () => {
        if (!imageUploadFnRef.current) return
        // Save cursor position NOW — file dialog will steal focus from the editor
        const savedRange = quill.getSelection() ?? { index: quill.getLength(), length: 0 }
        const insertIndex = savedRange.index

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file || !imageUploadFnRef.current) return
          try {
            const url = await imageUploadFnRef.current(file)
            quill.focus()
            quill.insertEmbed(insertIndex, 'image', url, 'user')
            quill.setSelection(insertIndex + 1, 0)
          } catch (err) {
            console.error('[RichEditor] 图片上传失败:', err)
          }
        }
        input.click()
      })
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
      className="rich-editor-wrapper overflow-hidden rounded-lg border border-slate-700/60"
      style={{ minHeight }}
    />
  )
}
