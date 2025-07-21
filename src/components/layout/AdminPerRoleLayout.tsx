import { useState } from 'react';
import { Users, LayoutDashboard, LogOut, Menu, X, Building2 } from 'lucide-react';
import { Outlet } from 'react-router-dom';

const AdminPerRoleLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:block hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        md:fixed static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'md:-translate-x-full translate-x-0'}
      `}>
        <div className="flex flex-col h-full bg-white border-r">
          {/* Mobile close button */}
          <div className="md:flex hidden items-center justify-between p-4">
            <span className="text-lg font-semibold text-gray-800">Menu</span>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Logo section */}
          <div className="flex flex-col items-center justify-center pt-5 px-4">
            <div className="flex items-center flex-col gap-2">
              <img 
                className="md:h-32 h-44 object-contain" 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Department_of_Information_and_Communications_Technology_%28DICT%29.svg/330px-Department_of_Information_and_Communications_Technology_%28DICT%29.svg.png" 
                alt="DICT Logo" 
              />
              <div className="flex flex-col items-center justify-center bg-blue-500 p-1 rounded-sm">
                <h1 className="text-[8px] text-white">Region-10</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col flex-grow px-4 md:mt-6 mt-10 md:gap-3 gap-5">
            <nav className="flex flex-col md:gap-2 gap-3">
              <a 
                href="#" 
                className="flex items-center md:px-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg"
                onClick={closeSidebar}
              >
                <LayoutDashboard className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                <span className="md:text-sm text-base">Dashboard</span>
              </a>
              <a 
                href="/redocs/adminRole/documents" 
                className="flex items-center md:px-3 px-4 py-2 hover:text-blue-600 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                onClick={closeSidebar}
              >
                <Users className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                <span className="md:text-sm text-base">Document Tracker</span>
              </a>
              <a 
                href="#" 
                className="flex items-center md:px-3 px-4 py-2 hover:text-blue-600 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                onClick={closeSidebar}
              >
                <Building2 className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                <span className="md:text-sm text-base">Documents</span>
              </a>
            </nav>
          </div>

          {/* Logout button */}
          <div className="flex flex-shrink-0 p-4 border-t">
            <button 
              className="flex items-center w-full px-3 sm:px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={closeSidebar}
            >
              <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-3" />
              <span className="text-sm sm:text-base">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
        <header className="bg-white shadow-sm z-10">
          <div className=" slg:px-6 px-8">
            <div className="flex items-center justify-between md:h-14 h-16">
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:block hidden mr-2"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="md:text-base text-lg font-semibold text-gray-800">Admin Dashboard</h1>
              </div>
              
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto md:p-3 slg:p-4 lg:p-6 p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPerRoleLayout;