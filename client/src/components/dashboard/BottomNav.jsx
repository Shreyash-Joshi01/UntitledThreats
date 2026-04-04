import React from 'react';
import { Home, Shield, Activity, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'shield', icon: Shield, label: 'Policy' },
    { id: 'activity', icon: Activity, label: 'Activity' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 bottom-nav-safe z-50">
      <nav className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center w-16 pt-2 pb-1 relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full"></span>
              )}
              <Icon 
                className={`w-6 h-6 mb-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-primary fill-primary/10 scale-110' 
                    : 'text-on-surface-variant group-hover:text-on-surface scale-100'
                }`} 
              />
              <span 
                className={`text-[10px] font-semibold transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
