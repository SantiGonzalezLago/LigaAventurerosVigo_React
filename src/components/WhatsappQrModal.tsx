import { Modal } from './Modal';

export function WhatsappQrModal({
  isOpen,
  whatsappLink,
  onClose,
}: {
  isOpen: boolean;
  whatsappLink: string;
  onClose: () => void;
}) {
  const qrUrl = whatsappLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(whatsappLink)}`
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WhatsApp">
      <div className="modal-body">
        <p className="qr-label">Escanea el código QR</p>
        {qrUrl && <img src={qrUrl} alt="WhatsApp QR" className="qr-image" />}
        <p className="qr-or">O abre directamente:</p>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-link">
          Abrir WhatsApp
        </a>
      </div>
    </Modal>
  );
}
