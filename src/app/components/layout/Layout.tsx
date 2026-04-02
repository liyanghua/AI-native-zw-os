import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Layers,
  User,
} from "lucide-react";
import { getPageTitle, navigation, roles } from "../../navigation";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleChange = (role: (typeof roles)[number]) => {
    navigate(role.path);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <Layers className="size-6 text-blue-600" />
          <div className="ml-3">
            <div className="text-sm font-semibold text-slate-900">AI-native</div>
            <div className="text-xs text-slate-500">经营操盘系统V2</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item, index) =>
              item.type === "separator" ? (
                <div key={index} className="h-px bg-slate-200 my-3" />
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="size-4 mr-3" />
                  {item.name}
                </Link>
              )
            )}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center">
            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="size-4 text-slate-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">张伟</div>
              <div className="text-xs text-slate-500">系统管理员</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-slate-900">{getPageTitle(location.pathname)}</h1>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  location.pathname === role.path
                    ? "bg-white text-slate-900 font-medium shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
