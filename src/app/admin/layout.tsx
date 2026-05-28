import type { Metadata } from "next";

import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Admin Dashboard - Brainovision",
  description: "Manage certificates and templates",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar can go here */}
      <div className="w-64 bg-indigo-900 text-white min-h-screen p-4 hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Admin Panel</h1>
        <nav className="space-y-2">
          <a href="/admin" className="block px-4 py-2 rounded hover:bg-indigo-700 transition">Certificates</a>
          <a href="/admin/offer-letters" className="block px-4 py-2 rounded hover:bg-indigo-700 transition">Offer Letters</a>
          <a href="/admin/templates" className="block px-4 py-2 rounded hover:bg-indigo-700 transition">Templates</a>
          <a href="/admin/settings" className="block px-4 py-2 rounded hover:bg-indigo-700 transition">Settings</a>
          <LogoutButton />
        </nav>
      </div>
      <div className="flex-1">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
