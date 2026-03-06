export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="bg-white border border-red-200 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-red-100 mb-6">
          <span className="text-4xl">❌</span>
        </div>

        <h1 className="text-3xl font-bold text-red-600 mb-3">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You are not authorized to access this page. Please login with the
          correct credentials to continue.
        </p>

        <a
          href="/admin/login"
          className="inline-block w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}