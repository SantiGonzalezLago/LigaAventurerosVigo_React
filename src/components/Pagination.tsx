import { useEffect, useState } from 'react';

export function Pagination({
  currentPage,
  totalPages,
  total,
  itemsCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsCount: number;
  onPageChange: (page: number) => void;
}) {
  const [visible, setVisible] = useState(window.innerWidth < 768 ? 3 : 5);

  useEffect(() => {
    const onResize = () => setVisible(window.innerWidth < 768 ? 3 : 5);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const total_ = totalPages || 1;
  let start = Math.max(1, currentPage - Math.floor(visible / 2));
  let end = start + visible - 1;
  if (end > total_) {
    end = total_;
    start = Math.max(1, end - visible + 1);
  }

  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const showFirst = pages.length > 0 && pages[0] > 1;
  const showLast = pages.length > 0 && pages[pages.length - 1] < total_;

  const goTo = (page: number) => {
    if (page < 1 || page > total_) return;
    onPageChange(page);
  };

  return (
    <div className="pagination-container">
      <div className="pagination-summary">
        {totalPages > 1
          ? `Mostrando ${itemsCount} de ${total} resultados`
          : `Mostrando ${itemsCount} resultados`}
      </div>
      {totalPages > 1 && (
        <div className="pagination-track">
          {showFirst && (
            <button className="page-btn" disabled={currentPage === 1} onClick={() => goTo(1)} aria-label="Primero">
              «
            </button>
          )}
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn${currentPage === p ? ' active' : ''}`}
              onClick={() => goTo(p)}
            >
              {p}
            </button>
          ))}
          {showLast && (
            <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => goTo(totalPages)} aria-label="Último">
              »
            </button>
          )}
        </div>
      )}
    </div>
  );
}
