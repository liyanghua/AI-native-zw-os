import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-6xl font-semibold text-slate-900 mb-4">404</h1>
        <p className="text-lg text-slate-600 mb-8">页面未找到</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Home className="size-4 mr-2" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
