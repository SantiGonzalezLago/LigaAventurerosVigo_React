import { usePageTitle } from '../hooks/usePageTitle';

export function HomePage() {
  usePageTitle();

  return (
    <div className="page-content">
      <div className="card mb-2">
        <p>
          Bienvenido a la Liga de Aventureros de Vigo. Desde aquí podrás consultar tus partidas, gestionar tu perfil
          y, si tienes los permisos adecuados, administrar el sistema.
        </p>
      </div>
    </div>
  );
}
