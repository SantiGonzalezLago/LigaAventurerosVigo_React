import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';

function isImageUpload(type: string) {
  return type === 'image';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    image.src = url;
  });
}

async function resizeImage(file: File, maxDimension: number): Promise<{ file: File; previewUrl: string } | null> {
  let image: HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    return null;
  }

  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const resizedFile = new File([blob], file.name, { type: blob.type || file.type, lastModified: Date.now() });
      resolve({ file: resizedFile, previewUrl: canvas.toDataURL(blob.type || file.type) });
    }, file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
  });
}

function getFileNameFromUrl(url: URL) {
  const segments = url.pathname.split('/').filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : 'archivo';
}

export function FileUploadModal({
  isOpen,
  onClose,
  onFileSelected,
  onFileError,
  type = 'image',
  fileMaxSize,
  imageMaxDimension,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (selection: { file: File; previewUrl: string; source: 'device' | 'url' }) => void;
  onFileError?: (message: string) => void;
  type?: string;
  fileMaxSize?: number | null;
  imageMaxDimension?: number | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) setFileUrl('');
  }, [isOpen]);

  const title = isImageUpload(type) ? 'Subir imagen' : 'Subir archivo';
  const acceptAttribute = isImageUpload(type) ? 'image/*' : type;

  const setError = (message: string) => onFileError?.(message);

  const processFile = async (inputFile: File, source: 'device' | 'url') => {
    if (isImageUpload(type) && !inputFile.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    let file = inputFile;
    let previewUrl = '';

    if (isImageUpload(type)) {
      try {
        if (imageMaxDimension && imageMaxDimension > 0) {
          const resized = await resizeImage(file, imageMaxDimension);
          if (!resized) {
            setError('No se pudo procesar la imagen');
            return;
          }
          file = resized.file;
          previewUrl = resized.previewUrl;
        } else {
          previewUrl = await fileToDataUrl(file);
        }
      } catch {
        setError('No se pudo procesar la imagen');
        return;
      }
    }

    if (fileMaxSize && fileMaxSize > 0 && file.size > fileMaxSize) {
      setError(`El archivo supera el tamaño máximo de ${formatBytes(fileMaxSize)}`);
      return;
    }

    setFileUrl('');
    onFileSelected({ file, previewUrl, source });
    onClose();
  };

  const selectFromDevice = () => fileInputRef.current?.click();

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file, 'device');
  };

  const onFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file, 'device');
    event.target.value = '';
  };

  const uploadFromUrl = async () => {
    if (isFetchingUrl) return;
    const rawUrl = fileUrl.trim();
    if (!rawUrl) {
      setError('Introduce una URL válida');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      setError('Introduce una URL válida');
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      setError('La URL debe usar http o https');
      return;
    }

    setIsFetchingUrl(true);
    try {
      const response = await fetch(parsedUrl.toString());
      if (!response.ok) {
        setError('No se pudo descargar el archivo desde la URL');
        return;
      }
      const blob = await response.blob();
      const fileName = getFileNameFromUrl(parsedUrl);
      const fallbackType = isImageUpload(type) ? 'image/png' : type;
      const fileType = blob.type || fallbackType;
      const file = new File([blob], fileName, { type: fileType, lastModified: Date.now() });
      await processFile(file, 'url');
    } catch {
      setError('No se pudo descargar el archivo desde la URL');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        <div
          className={`drop-panel${isDragOver ? ' drop-panel-active' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Arrastra un archivo o pulsa para seleccionarlo"
          onClick={selectFromDevice}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') selectFromDevice();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={onDrop}
        >
          <span className="drop-panel-icon" aria-hidden="true">⬆</span>
          <p className="drop-panel-title">Seleccionar archivo</p>
          <p className="drop-panel-subtitle">Arrastra un archivo aquí o pulsa para abrir el selector</p>
        </div>

        <div className="separator" aria-hidden="true">
          <span>o</span>
        </div>

        <div className="url-upload-row">
          <div className="item">
            <input
              type="url"
              autoComplete="off"
              placeholder="https://..."
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void uploadFromUrl();
              }}
            />
          </div>
          {fileUrl && (
            <button type="button" className="btn btn-block" onClick={() => void uploadFromUrl()} disabled={isFetchingUrl}>
              {isFetchingUrl ? 'Cargando...' : 'Cargar'}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          className="hidden-file-input"
          type="file"
          accept={acceptAttribute}
          onChange={(event) => void onFileInputChange(event)}
        />
      </div>
    </Modal>
  );
}
