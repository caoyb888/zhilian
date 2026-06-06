import { clsx } from 'clsx'

interface PaginationProps {
  page: number
  total: number
  size: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, size, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (total === 0) return null

  const btnBase =
    'rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

  const pageNums: number[] = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    pageNums.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
      <span>
        共 <span className="font-medium text-gray-800">{total}</span> 条，第{' '}
        <span className="font-medium text-gray-800">{page}</span> / {pages} 页
      </span>
      <div className="flex items-center gap-1">
        <button
          className={clsx(btnBase, 'border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40')}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>

        {pageNums[0] > 1 && (
          <>
            <button className={clsx(btnBase, 'border border-gray-200 bg-white hover:bg-gray-50')} onClick={() => onChange(1)}>
              1
            </button>
            {pageNums[0] > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {pageNums.map((n) => (
          <button
            key={n}
            className={clsx(
              btnBase,
              n === page
                ? 'border border-brand-500 bg-brand-500 text-white'
                : 'border border-gray-200 bg-white hover:bg-gray-50'
            )}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}

        {pageNums[pageNums.length - 1] < pages && (
          <>
            {pageNums[pageNums.length - 1] < pages - 1 && <span className="px-1 text-gray-400">…</span>}
            <button className={clsx(btnBase, 'border border-gray-200 bg-white hover:bg-gray-50')} onClick={() => onChange(pages)}>
              {pages}
            </button>
          </>
        )}

        <button
          className={clsx(btnBase, 'border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40')}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
