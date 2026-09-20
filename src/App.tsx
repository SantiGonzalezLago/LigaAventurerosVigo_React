import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageHeaderProvider } from './context/PageHeaderContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { RequireAdmin, RequireMaster } from './routes/guards';
import { TabsLayout } from './layouts/TabsLayout';
import { SplashScreen } from './components/SplashScreen';
import { AppMenu } from './components/AppMenu';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { WhatsappQrModal } from './components/WhatsappQrModal';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/users/ProfilePage';
import { MasterControlPanelPage } from './pages/master/MasterControlPanelPage';
import { AdminControlPanelPage } from './pages/admin/AdminControlPanelPage';
import { ManageUsersPage } from './pages/admin/manageUsers/ManageUsersPage';
import { ServerSettingsPage } from './pages/admin/ServerSettingsPage';
import { UploadFilesLogPage } from './pages/admin/UploadFilesLogPage';
import { ManageGameTypesPage } from './pages/admin/manageGameTypes/ManageGameTypesPage';
import { ManageGameSystemsPage } from './pages/admin/manageGameSystems/ManageGameSystemsPage';
import { ManageGameSystemPage } from './pages/admin/manageGameSystems/manageGameSystem/ManageGameSystemPage';

function AppShell() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  return (
    <>
      {showSplash && <SplashScreen onDismissed={() => setShowSplash(false)} />}

      <AppMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenLogin={() => {
          setIsMenuOpen(false);
          setIsLoginModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenWhatsappQr={(link) => {
          setWhatsappLink(link);
          setIsWhatsappModalOpen(true);
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<TabsLayout onOpenMenu={() => setIsMenuOpen(true)} onOpenLogin={() => setIsLoginModalOpen(true)} />}
        >
          <Route index element={<HomePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:uid" element={<ProfilePage />} />

          <Route element={<RequireMaster />}>
            <Route path="master" element={<MasterControlPanelPage />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminControlPanelPage />} />
            <Route path="admin/users" element={<ManageUsersPage />} />
            <Route path="admin/server-settings" element={<ServerSettingsPage />} />
            <Route path="admin/upload-files-log" element={<UploadFilesLogPage />} />
            <Route path="admin/game-systems" element={<ManageGameSystemsPage />} />
            <Route path="admin/game-types" element={<ManageGameTypesPage />} />
            <Route path="admin/game-systems/:slug" element={<ManageGameSystemPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <WhatsappQrModal
        isOpen={isWhatsappModalOpen}
        whatsappLink={whatsappLink}
        onClose={() => setIsWhatsappModalOpen(false)}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <PageHeaderProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AppShell />
              </ConfirmProvider>
            </ToastProvider>
          </PageHeaderProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
