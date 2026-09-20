import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useUser } from '../../context/UserContext';

export function ProfilePage() {
  usePageTitle('Perfil');
  const { uid: routeUid } = useParams();
  const navigate = useNavigate();
  const { activeUid } = useUser();

  const uid = routeUid?.trim() || activeUid;

  useEffect(() => {
    if (!uid) navigate('/', { replace: true });
  }, [uid, navigate]);

  const isOwnProfile = uid === activeUid;

  return (
    <div className="page-content">
      <div className="card">
        <h2>Perfil</h2>
        <p className="text-medium">{uid}</p>
        {isOwnProfile && <p className="text-medium">Este es tu perfil.</p>}
      </div>
    </div>
  );
}
