import { useEffect, useState } from 'react';

export function SplashScreen({ onDismissed }: { onDismissed: () => void }) {
  const [fading, setFading] = useState(false);
  const isTouchScreen = window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setFading((current) => {
      if (current) return current;
      setTimeout(() => onDismissed(), 400);
      return true;
    });
  };

  return (
    <div className={`splash-overlay${fading ? ' fading' : ''}`} onClick={dismiss}>
      <div className="splash-content">
        <span className="splash-logo">Liga de Aventureros de Vigo</span>
      </div>
      <span className="splash-hint">{isTouchScreen ? 'Toca para continuar' : 'Haz clic para continuar'}</span>
    </div>
  );
}
