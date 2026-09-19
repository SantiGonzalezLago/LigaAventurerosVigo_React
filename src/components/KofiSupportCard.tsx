function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function KofiSupportCard({
  title = '¡Apóyanos en Ko-fi!',
  kofiLink,
}: {
  title?: string;
  kofiLink: string;
}) {
  const href = normalizeUrl(kofiLink);
  const displayUrl = href.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  return (
    <a className="kofi-cta" href={href} target="_blank" rel="noopener noreferrer">
      <div className="kofi-cta-text">
        <span className="kofi-cta-title">{title}</span>
        <span className="kofi-cta-link">
          <img src="/assets/kofi.png" alt="Ko-fi" className="kofi-icon" />
          {displayUrl}
        </span>
      </div>
    </a>
  );
}
