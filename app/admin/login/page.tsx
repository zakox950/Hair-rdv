import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Administration</h1>
          <p className="mt-1 text-sm text-stone-500">
            {process.env.NEXT_PUBLIC_SALON_NAME}
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
