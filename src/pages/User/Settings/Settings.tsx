import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Save, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);

    // Profile settings
    const [profile, setProfile] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dict.gov.ph',
        phone: '+63 912 345 6789',
        department: 'Information Technology',
        position: 'IT Specialist',
        employeeId: 'EMP-2025-001'
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        documentUpdates: true,
        approvalAlerts: true,
        systemMaintenance: false,
        weeklyReports: true
    });

    // Security settings
    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorAuth: false,
        sessionTimeout: '30'
    });

    const handleProfileChange = (field: string, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationChange = (field: string, value: boolean) => {
        setNotifications(prev => ({ ...prev, [field]: value }));
    };

    const handleSecurityChange = (field: string, value: string | boolean) => {
        setSecurity(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = () => {
        console.log('Saving profile:', profile);
        // Add save logic here
    };

    const handleSaveNotifications = () => {
        console.log('Saving notifications:', notifications);
        // Add save logic here
    };

    const handleSaveSecurity = () => {
        console.log('Saving security settings:', security);
        // Add save logic here
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Globe }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <SettingsIcon className="w-8 h-8 text-gray-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600">Manage your account settings and preferences</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                        <nav className="space-y-1 p-4">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                                ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mr-3" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.firstName}
                                                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.lastName}
                                                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => handleProfileChange('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => handleProfileChange('phone', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Department
                                            </label>
                                            <select
                                                value={profile.department}
                                                onChange={(e) => handleProfileChange('department', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="Information Technology">Information Technology</option>
                                                <option value="Human Resources">Human Resources</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Operations">Operations</option>
                                                <option value="Administration">Administration</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Position
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.position}
                                                onChange={(e) => handleProfileChange('position', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between py-3 border-b">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {key === 'emailNotifications' && 'Receive notifications via email'}
                                                    {key === 'documentUpdates' && 'Get notified when documents are updated'}
                                                    {key === 'approvalAlerts' && 'Alerts for approval requests'}
                                                    {key === 'systemMaintenance' && 'System maintenance notifications'}
                                                    {key === 'weeklyReports' && 'Weekly summary reports'}
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => handleNotificationChange(key, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleSaveNotifications}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={security.currentPassword}
                                                        onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={security.newPassword}
                                                    onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={security.confirmPassword}
                                                    onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-md font-medium text-gray-900 mb-4">Additional Security</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                                                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={security.twoFactorAuth}
                                                        onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Session Timeout (minutes)
                                                </label>
                                                <select
                                                    value={security.sessionTimeout}
                                                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                >
                                                    <option value="15">15 minutes</option>
                                                    <option value="30">30 minutes</option>
                                                    <option value="60">1 hour</option>
                                                    <option value="120">2 hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={handleSaveSecurity}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Security
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Preferences</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                            <option value="en">English</option>
                                            <option value="fil">Filipino</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Timezone
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                            <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date Format
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
