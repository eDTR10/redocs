import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, FileText, Search, Filter } from 'lucide-react';

const DocumentTrack = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        // Sample tracking data
        const sampleDocuments: any[] = [
            {
                id: '1',
                name: 'Office Supplies Request',
                title: 'Office Supplies Request',
                type: 'Purchase Request',
                status: 'Pending',
                dateCreated: '2025-07-15',
                lastModified: '2025-07-15',
                size: '1.2 MB',
                submittedBy: 'John Doe',
                dateSubmitted: '2025-07-15',
                currentStatus: 'Under Review',
                trackingNumber: 'PR-2025-001',
                steps: [
                    {
                        id: '1',
                        title: 'Document Submitted',
                        description: 'Request submitted by employee',
                        status: 'completed',
                        date: '2025-07-15 09:00 AM',
                        assignedTo: 'John Doe'
                    },
                    {
                        id: '2',
                        title: 'Initial Review',
                        description: 'Document reviewed by supervisor',
                        status: 'completed',
                        date: '2025-07-15 11:30 AM',
                        assignedTo: 'Jane Smith',
                        comments: 'All required information provided'
                    },
                    {
                        id: '3',
                        title: 'Department Approval',
                        description: 'Awaiting department head approval',
                        status: 'current',
                        assignedTo: 'Mike Johnson'
                    },
                    {
                        id: '4',
                        title: 'Finance Review',
                        description: 'Budget verification and approval',
                        status: 'pending',
                        assignedTo: 'Finance Team'
                    },
                    {
                        id: '5',
                        title: 'Final Approval',
                        description: 'Final authorization and processing',
                        status: 'pending',
                        assignedTo: 'Director'
                    }
                ]
            },
            {
                id: '2',
                name: 'Equipment Purchase Order',
                title: 'Equipment Purchase Order',
                type: 'Purchase Order',
                status: 'Approved',
                dateCreated: '2025-07-14',
                lastModified: '2025-07-14',
                size: '980 KB',
                submittedBy: 'Jane Smith',
                dateSubmitted: '2025-07-14',
                currentStatus: 'Approved',
                trackingNumber: 'PO-2025-002',
                steps: [
                    {
                        id: '1',
                        title: 'Document Submitted',
                        description: 'Purchase order created',
                        status: 'completed',
                        date: '2025-07-14 10:00 AM',
                        assignedTo: 'Jane Smith'
                    },
                    {
                        id: '2',
                        title: 'Initial Review',
                        description: 'Document reviewed and validated',
                        status: 'completed',
                        date: '2025-07-14 02:00 PM',
                        assignedTo: 'Mike Johnson'
                    },
                    {
                        id: '3',
                        title: 'Finance Approval',
                        description: 'Budget approved',
                        status: 'completed',
                        date: '2025-07-15 09:00 AM',
                        assignedTo: 'Finance Team'
                    },
                    {
                        id: '4',
                        title: 'Final Approval',
                        description: 'Purchase order approved',
                        status: 'completed',
                        date: '2025-07-15 03:00 PM',
                        assignedTo: 'Director'
                    }
                ]
            }
        ];
        setDocuments(sampleDocuments);
        setSelectedDocument(sampleDocuments[0]);
    }, []);

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = (doc.title || doc.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === '' || doc.currentStatus === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'current':
                return <Clock className="w-6 h-6 text-blue-500" />;
            case 'rejected':
                return <XCircle className="w-6 h-6 text-red-500" />;
            default:
                return <AlertCircle className="w-6 h-6 text-gray-400" />;
        }
    };

    const getStepColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'border-green-500 bg-green-50';
            case 'current':
                return 'border-blue-500 bg-blue-50';
            case 'rejected':
                return 'border-red-500 bg-red-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <MapPin className="w-8 h-8 text-purple-600 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Document Tracking</h1>
                            <p className="text-gray-600">Track the progress of your submitted documents</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by title or tracking number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Status</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                    </select>

                    <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Your Documents</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {filteredDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    onClick={() => setSelectedDocument(document)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedDocument?.id === document.id ? 'bg-purple-50 border-purple-200' : ''
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <FileText className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {document.title}
                                            </h4>
                                            <p className="text-sm text-gray-500">{document.trackingNumber}</p>
                                            <div className="mt-2">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {document.currentStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Document Details and Tracking */}
                <div className="lg:col-span-2">
                    {selectedDocument ? (
                        <div className="bg-white rounded-lg shadow">
                            {/* Document Header */}
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {selectedDocument.title}
                                        </h2>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Tracking Number:</span> {selectedDocument.trackingNumber}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Type:</span> {selectedDocument.type}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Submitted by:</span> {selectedDocument.submittedBy}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Date Submitted:</span> {selectedDocument.dateSubmitted}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                            {selectedDocument.currentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Steps */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Progress</h3>
                                <div className="space-y-4">
                                    {selectedDocument.steps.map((step, index) => (
                                        <div key={step.id} className="relative">
                                            {/* Connector Line */}
                                            {index < selectedDocument.steps.length - 1 && (
                                                <div className="absolute left-3 top-10 w-0.5 h-16 bg-gray-300"></div>
                                            )}

                                            <div className={`relative flex items-start p-4 rounded-lg border-2 ${getStepColor(step.status)}`}>
                                                <div className="flex-shrink-0 mr-4">
                                                    {getStepIcon(step.status)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            {step.title}
                                                        </h4>
                                                        {step.date && (
                                                            <span className="text-xs text-gray-500">
                                                                {step.date}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {step.description}
                                                    </p>

                                                    {step.assignedTo && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            <span className="font-medium">Assigned to:</span> {step.assignedTo}
                                                        </p>
                                                    )}

                                                    {step.comments && (
                                                        <div className="mt-2 p-2 bg-white rounded border">
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Comments:</span> {step.comments}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <MapPin className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
                            <p className="text-gray-500">Choose a document from the list to view its tracking details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentTrack;
