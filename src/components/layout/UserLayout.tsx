import { useState, useEffect } from 'react';
import { FileText, Settings, LogOut, Menu, X, Search, ChevronRight, Plus } from 'lucide-react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';

const UserLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [myDocumentsOpen, setMyDocumentsOpen] = useState(false);

    // Determine active navigation based on current route
    const getActiveNavigation = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) {
            return { activeNav: 'dashboard', activeSubNav: '' };
        } else if (path.includes('/documents/create')) {
            return { activeNav: 'my-documents', activeSubNav: 'create-document' };
        } else if (path.includes('/documents/track')) {
            return { activeNav: 'my-documents', activeSubNav: 'track-document' };
        } else if (path.includes('/settings')) {
            return { activeNav: 'settings', activeSubNav: '' };
        } else if (path.includes('/documents')) {
            return { activeNav: 'my-documents', activeSubNav: '' };
        }
        return { activeNav: 'dashboard', activeSubNav: '' };
    };

    const { activeNav, activeSubNav } = getActiveNavigation();

    // Auto-open My Documents submenu when on documents pages
    useEffect(() => {
        if (activeNav === 'my-documents') {
            setMyDocumentsOpen(true);
        }
    }, [activeNav]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleMyDocuments = () => {
        setMyDocumentsOpen(!myDocumentsOpen);
    };

    const handleNavClick = (path?: string) => {
        if (path) {
            navigate(path);
        }
        closeSidebar();
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
                            <div className="flex flex-col items-center justify-center bg-green-500 p-1 rounded-sm">
                                <h1 className="text-[8px] text-white">Region-10</h1>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col flex-grow px-4 md:mt-6 mt-10 md:gap-3 gap-5">
                        <nav className="flex flex-col md:gap-2 gap-3">
                            {/* Dashboard */}
                            <Link
                                to="/redocs/user/dashboard"
                                className={`flex items-center md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 ${activeNav === 'dashboard'
                                    ? 'text-green-600 bg-green-50'
                                    : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => handleNavClick()}
                            >
                                <Search className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                <span className="md:text-sm text-base">Dashboard</span>
                            </Link>

                            {/* My Documents with Submenu */}
                            <div className="flex flex-col">
                                <button
                                    className={`flex items-center justify-between md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 w-full text-left ${activeNav === 'my-documents'
                                        ? 'text-green-600 bg-green-50'
                                        : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    onClick={toggleMyDocuments}
                                >
                                    <div className="flex items-center">
                                        <FileText className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                        <span className="md:text-sm text-base">My Documents</span>
                                    </div>
                                    <ChevronRight
                                        className={`md:w-4 md:h-4 w-5 h-5 transition-transform duration-200 ${myDocumentsOpen ? 'rotate-90' : ''
                                            }`}
                                    />
                                </button>

                                {/* My Documents Submenu */}
                                {myDocumentsOpen && (
                                    <div className="ml-4 mt-2 flex flex-col md:gap-1 gap-2">
                                        <Link
                                            to="/redocs/user/documents"
                                            className={`flex items-center md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 ${activeSubNav === '' && activeNav === 'my-documents'
                                                ? 'text-green-600 bg-green-50'
                                                : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                                }`}
                                            onClick={() => handleNavClick()}
                                        >
                                            <FileText className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                            <span className="md:text-sm text-base">All Documents</span>
                                        </Link>
                                        <Link
                                            to="/redocs/user/documents/create"
                                            className={`flex items-center md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 ${activeSubNav === 'create-document'
                                                ? 'text-green-600 bg-green-50'
                                                : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                                }`}
                                            onClick={() => handleNavClick()}
                                        >
                                            <Plus className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                            <span className="md:text-sm text-base">Create Document</span>
                                        </Link>
                                        <Link
                                            to="/redocs/user/documents/track"
                                            className={`flex items-center md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 ${activeSubNav === 'track-document'
                                                ? 'text-green-600 bg-green-50'
                                                : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                                }`}
                                            onClick={() => handleNavClick()}
                                        >
                                            <Search className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                            <span className="md:text-sm text-base">Document Track</span>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Settings */}
                            <Link
                                to="/redocs/user/settings"
                                className={`flex items-center md:px-3 px-4 py-2 rounded-lg transition-colors duration-200 ${activeNav === 'settings'
                                    ? 'text-green-600 bg-green-50'
                                    : 'hover:text-green-600 text-gray-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => handleNavClick()}
                            >
                                <Settings className="md:w-4 md:h-4 w-5 h-5 mr-3" />
                                <span className="md:text-sm text-base">Settings</span>
                            </Link>
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
                {/* Top header */}
                <header className="bg-white shadow-sm z-10">
                    <div className="slg:px-6 px-8">
                        <div className="flex items-center justify-between md:h-14 h-16">
                            <div className="flex items-center">
                                {/* Mobile menu button */}
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:block hidden mr-2"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                                <div className="flex flex-col">
                                    <h1 className="md:text-base text-lg font-semibold text-gray-800">User Portal</h1>
                                    {/* Breadcrumb */}
                                    {activeNav && (
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <span className="capitalize">
                                                {activeNav === 'my-documents' ? 'My Documents' : activeNav}
                                            </span>
                                            {activeSubNav && (
                                                <>
                                                    <span className="mx-1">/</span>
                                                    <span className="capitalize">
                                                        {activeSubNav.replace('-', ' ')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center md:space-x-2 space-x-4">
                                {/* Document Type Selection for Create Document */}
                                {activeSubNav === 'create-document' && (
                                    <select className="md:px-2 px-3 py-1 md:text-xs text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                        <option value="">Select Document Type</option>
                                        <option value="purchase-request">Purchase Request</option>
                                        {/* <option value="purchase-order">Purchase Order</option>
                                        <option value="memo">Memo</option>
                                        <option value="letter">Letter</option>
                                        <option value="report">Report</option> */}
                                    </select>
                                )}
                                <Link
                                    to="/redocs/user/documents/create"
                                    className="inline-flex items-center md:px-2 px-4 py-2 md:text-xs text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                >
                                    <FileText className="md:w-3 md:h-3 w-4 h-4 md:mr-1 mr-2" />
                                    <span className="md:hidden">New Document</span>
                                    <span className="md:block hidden">New</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto md:p-3 slg:p-4 lg:p-6 p-8 bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
