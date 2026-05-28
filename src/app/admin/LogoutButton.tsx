"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/admin/login');
  };

  return (
    <button 
      className="block w-full text-left px-4 py-2 rounded hover:bg-red-600 transition mt-auto" 
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
