import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Loader } from '../../components/Loader';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { apiService, ApiError } from '../../services/apiService';
import { useUser } from '../../context/UserContext';

type LogEntry = {
  id: number;
  user_uid: string;
  user_name: string | null;
  file_name: string;
  remote_addr: string;
  size_bytes: number;
  timestamp: string;
  exists: boolean;
  note?: string | null;
  url?: string | null;
};

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getShortFileName(fileName: string) {
  return fileName.length > 40 ? `${fileName.slice(0, 37)}...` : fileName;
}

function isImagePreviewUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function UploadFilesLogPage() {
  usePageTitle('Log de subidas de ficheros', true);
  const { logout } = useUser();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [preview, setPreview] = useState<{ fileName: string; url: string; isImage: boolean } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    apiService
      .post<{
        message: string;
        logs: LogEntry[];
        pagination: { total: number; total_pages: number };
      }>('admin/upload-log', {
        page: currentPage,
        per_page: 20,
        order_by: sortBy,
        order_dir: sortDir,
        q: searchQuery,
        date_from: dateFrom || '',
        date_to: dateTo || '',
      })
      .then((response) => {
        setLogs(response.logs ?? []);
        setPagination(response.pagination ?? { total: 0, total_pages: 0 });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError('No se han podido cargar los registros.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortDir, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchDraft.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const onSort = (column: string) => {
    if (sortBy === column) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sortIcon = (column: string) => (sortBy === column ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const openPreview = (log: LogEntry) => {
    const url = log.url?.trim();
    if (!log.exists || !url) return;
    setPreview({ fileName: log.file_name, url, isImage: isImagePreviewUrl(url) });
  };

  return (
    <div className="page-content">
      {loading && <Loader />}

      <div className="search-container mb-1">
        <div className="searchbar">
          <Search size={18} aria-hidden="true" />
          <input
            placeholder="Buscar por nombre de archivo, carpeta, IP o usuario..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </div>
        <div className="filters-row" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <label style={{ flex: 1 }}>
            <span className="field-label">Desde</span>
            <div className="item">
              <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }} />
            </div>
          </label>
          <label style={{ flex: 1 }}>
            <span className="field-label">Hasta</span>
            <div className="item">
              <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setCurrentPage(1); }} />
            </div>
          </label>
        </div>
      </div>

      {error && logs.length === 0 && <ErrorState message={error} onRetry={load} />}

      {logs.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => onSort('user_name')}>Usuario{sortIcon('user_name')}</th>
                <th className="sortable" onClick={() => onSort('file_name')}>Fichero{sortIcon('file_name')}</th>
                <th className="sortable" onClick={() => onSort('remote_addr')}>IP{sortIcon('remote_addr')}</th>
                <th className="sortable" onClick={() => onSort('size_bytes')}>Tamaño{sortIcon('size_bytes')}</th>
                <th className="sortable" onClick={() => onSort('timestamp')}>Fecha{sortIcon('timestamp')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div>{log.user_name || 'Sin nombre'}</div>
                    <div className="text-medium">{log.user_uid}</div>
                  </td>
                  <td title={log.file_name}>
                    {log.exists && log.url ? (
                      <button type="button" className="btn-clear btn" onClick={() => openPreview(log)}>
                        {getShortFileName(log.file_name)}
                      </button>
                    ) : (
                      <div>{getShortFileName(log.file_name)}</div>
                    )}
                    <div>
                      <span className={`setting-status${log.exists ? '' : ' inactive'}`}>
                        {log.exists ? 'Disponible' : 'No existe'}
                      </span>
                      {log.note && <div className="text-medium" title={log.note}>{log.note}</div>}
                    </div>
                  </td>
                  <td>{log.remote_addr}</td>
                  <td>{formatBytes(log.size_bytes)}</td>
                  <td>{new Date(log.timestamp).toLocaleString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="empty-container">
          <h3>Sin resultados</h3>
          <p>{searchQuery || dateFrom || dateTo ? 'No se encontraron registros con los filtros actuales.' : 'Todavía no hay registros de subidas.'}</p>
        </div>
      )}

      {logs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.total_pages}
          total={pagination.total}
          itemsCount={logs.length}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title="Ver fichero">
        <div className="modal-body">
          {preview?.isImage ? (
            <img src={preview.url} alt={preview.fileName} style={{ maxWidth: '100%', borderRadius: 12 }} />
          ) : (
            preview && (
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="btn btn-block">
                Abrir {preview.fileName}
              </a>
            )
          )}
        </div>
      </Modal>
    </div>
  );
}
