import { AdminLogin } from "./AdminLogin";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">Gomodi Admin</h1>
          <p className="text-stone-600">Staff approval and management screen</p>
        </div>
        <AdminLogin />
      </div>
    </div>
  );
}
