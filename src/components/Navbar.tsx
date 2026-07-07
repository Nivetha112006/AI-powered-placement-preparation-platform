import { Briefcase, User, BarChart2, Shield, LogOut, FileText } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userName: string;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
  onLogout: () => void;
  id?: string;
}

export function Navbar({
  currentTab,
  setCurrentTab,
  userName,
  isAdmin,
  setIsAdmin,
  onLogout,
  id = 'navbar'
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#09090B]/90 backdrop-blur-md" id={id}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')} id="navbar-brand">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-semibold font-serif tracking-tight text-white block">
              PlacementAI
            </span>
            <span className="block text-[8px] text-zinc-400 font-mono tracking-widest font-bold uppercase">
              Corporate Recruitment Simulator
            </span>
          </div>
        </div>

        {/* Primary Tabs */}
        <nav className="hidden md:flex space-x-1" id="navbar-tabs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'resume', label: 'Resume Analyzer', icon: FileText },
            { id: 'profile', label: 'Manage Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id && !isAdmin;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setIsAdmin(false);
                  setCurrentTab(tab.id);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase font-sans transition-colors ${
                  active
                    ? 'bg-zinc-800/80 text-indigo-400 border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
                id={`nav-tab-${tab.id}`}
              >
                <Icon className="h-3.5 w-3.5 text-indigo-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile actions */}
        <div className="flex items-center space-x-4" id="navbar-actions">
          {/* Admin panel toggle */}
          <button
            onClick={() => {
              setIsAdmin(!isAdmin);
              if (!isAdmin) setCurrentTab('admin');
              else setCurrentTab('dashboard');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
              isAdmin
                ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
                : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
            }`}
            id="nav-admin-toggle"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAdmin ? 'Admin View' : 'Admin Panel'}</span>
          </button>

          {/* User info */}
          <div
            onClick={() => {
              setIsAdmin(false);
              setCurrentTab('profile');
            }}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition-opacity"
            id="nav-user-info"
            title="Access Profile"
          >
            <div className="h-8 w-8 bg-indigo-950/50 flex items-center justify-center rounded-full border border-indigo-900/60">
              <span className="text-xs font-bold text-indigo-400 uppercase">
                {userName.substring(0, 2)}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-white font-sans">
                {userName}
              </span>
              <span className="block text-[8px] text-indigo-400 font-mono font-bold tracking-wider">
                ● ACCESS PROFILE
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
            title="Sign Out"
            id="nav-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
