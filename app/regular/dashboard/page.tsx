// import React from "react";

// export default function Regular(){
//     return(
//         <div> Regular Dashboard Page</div>
//     )
// }

'use client';

import { useState } from 'react';
import { FiHome, FiUser, FiSettings } from 'react-icons/fi';

export default function Dashboard() {
  const [active, setActive] = useState('Home');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-70 bg-white shadow-md">
        <div className="p-6 text-2xl font-bold text-gray-900 border-b">
          Regular Dashboard
        </div>
        <nav className="mt-6">
          <SidebarItem
            icon={<FiHome size={20} />}
            label="Home"
            active={active === 'Home'}
            onClick={() => setActive('Home')}
          />
          <SidebarItem
            icon={<FiUser size={20} />}
            label="Profile"
            active={active === 'Profile'}
            onClick={() => setActive('Profile')}
          />
          <SidebarItem
            icon={<FiSettings size={20} />}
            label="Settings"
            active={active === 'Settings'}
            onClick={() => setActive('Settings')}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-semibold text-gray-800">
          {active} Section
        </h1>
        <p className="mt-4 text-gray-600">
          Welcome to the {active.toLowerCase()} section of your regular dashboard.
        </p>

        {/* Example of Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard title="Total Users" value="1,234" />
          <DashboardCard title="Active Sessions" value="58" />
          <DashboardCard title="Revenue" value="$12,345" />
        </div>
      </main>
    </div>
  );
}

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

// Sidebar Item Component
function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 space-x-3 rounded-lg cursor-pointer transition ${
        active
          ? 'bg-blue-500 text-white'
          : 'hover:bg-gray-200 text-gray-700'
      }`}
    >
      {icon}
      <span className="text-lg">{label}</span>
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  value: string;
};

// Dashboard Card Component
function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}
