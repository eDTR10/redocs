import { FileText, Download, Eye, Clock, Truck, CheckCircle, XCircle, FileStack } from 'lucide-react';

const UserDashboard = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Document Portal</h1>
                <p className="text-gray-600">Access and manage your documents easily.</p>
            </div>

            {/* Document Status Cards */}
            <div className="grid grid-cols-5 lg:grid-cols-1 md:grid-cols-1 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 rounded-lg p-3">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 rounded-lg p-3">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">In-Route</h3>
                            <p className="text-2xl font-bold text-gray-900">8</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 rounded-lg p-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
                            <p className="text-2xl font-bold text-gray-900">45</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="bg-red-100 rounded-lg p-3">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Declined</h3>
                            <p className="text-2xl font-bold text-gray-900">3</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="bg-purple-100 rounded-lg p-3">
                            <FileStack className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
                            <p className="text-2xl font-bold text-gray-900">68</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents and Logs Section */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Documents Table - Left Side (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">All Documents</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {[
                                    { name: "Project Guidelines 2024", type: "PDF", status: "Approved", date: "2024-07-15", statusColor: "green" },
                                    { name: "User Manual v3.2", type: "DOCX", status: "In-Route", date: "2024-07-14", statusColor: "blue" },
                                    { name: "Training Materials", type: "PDF", status: "Pending", date: "2024-07-12", statusColor: "yellow" },
                                    { name: "Policy Updates", type: "PDF", status: "Approved", date: "2024-07-10", statusColor: "green" },
                                    { name: "Meeting Notes", type: "DOCX", status: "Declined", date: "2024-07-08", statusColor: "red" },
                                    { name: "Budget Report Q2", type: "XLSX", status: "Pending", date: "2024-07-07", statusColor: "yellow" },
                                    { name: "Safety Guidelines", type: "PDF", status: "In-Route", date: "2024-07-05", statusColor: "blue" },
                                ].map((doc, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-gray-100 rounded-lg p-2 mr-3">
                                                    <FileText className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doc.statusColor === 'green' ? 'bg-green-100 text-green-800' :
                                                doc.statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                    doc.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-indigo-600 hover:text-indigo-900">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-indigo-600 hover:text-indigo-900">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Logs - Right Side (1/3 width) */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {[
                                { action: "Document approved", document: "Project Guidelines 2024", time: "2 hours ago", type: "success" },
                                { action: "Document uploaded", document: "User Manual v3.2", time: "4 hours ago", type: "info" },
                                { action: "Document declined", document: "Meeting Notes", time: "1 day ago", type: "error" },
                                { action: "Document in review", document: "Training Materials", time: "2 days ago", type: "warning" },
                                { action: "Document submitted", document: "Policy Updates", time: "3 days ago", type: "info" },
                                { action: "Document approved", document: "Safety Guidelines", time: "5 days ago", type: "success" },
                            ].map((log, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${log.type === 'success' ? 'bg-green-400' :
                                        log.type === 'error' ? 'bg-red-400' :
                                            log.type === 'warning' ? 'bg-yellow-400' :
                                                'bg-blue-400'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">{log.action}</p>
                                        <p className="text-sm text-gray-500 truncate">{log.document}</p>
                                        <p className="text-xs text-gray-400">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
