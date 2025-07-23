import { useState, useEffect } from 'react';
import { MapPin, FileText, Search, Filter } from 'lucide-react';
import { FilledDocument, Assignature } from '../../../../interfaces/Document';
import TrackingStep from './helper/TrackingStep';
import { mapDocumentToSteps } from './helper/mapDocumentToSteps';
import { fetchDocuments } from '@/services/documents/documents.api';

const DocumentTrack = () => {

    const [documents, setDocuments] = useState<FilledDocument[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<FilledDocument | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    // Removed unused loading and error state

    useEffect(() => {
        fetchDocuments()
            .then((data) => {
                setDocuments(data);
                setSelectedDocument(data[0] || null);
            });
    }, []);




    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.tracking_id || '').toLowerCase().includes(searchTerm.toLowerCase());
        // For status, you may want to map status number to label
        const matchesStatus = filterStatus === '' || String(doc.status) === filterStatus;
        return matchesSearch && matchesStatus;
    });



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
                <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or tracking number..."
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
                        <option value="1">Submitted</option>
                        <option value="2">In-Route</option>
                        <option value="3">Completed</option>
                    </select>

                    <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedDocument?.id === document.id ? 'bg-purple-50 border-purple-200' : ''}`}
                                >
                                    <div className="flex items-start">
                                        <FileText className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {document.name}
                                            </h4>
                                            <p className="text-sm text-gray-500">{document.tracking_id}</p>
                                            <div className="mt-2">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {document.status === 1 ? 'Submitted' : document.status === 2 ? 'In-Route' : document.status === 3 ? 'Completed' : document.status}
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
                                            {selectedDocument.name}
                                        </h2>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Tracking Number:</span> {selectedDocument.tracking_id}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Type:</span> {selectedDocument.template}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Submitted by:</span> {selectedDocument.submitted_by}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Date Submitted:</span> {selectedDocument.date_created ? new Date(selectedDocument.date_created).toLocaleDateString() : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                            {selectedDocument.status === 1 ? 'Submitted' : selectedDocument.status === 2 ? 'In-Route' : selectedDocument.status === 3 ? 'Completed' : selectedDocument.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Steps */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Progress</h3>
                                <div className="space-y-4">
                                    {mapDocumentToSteps(selectedDocument).map((step, index, arr) => (
                                        <TrackingStep
                                            key={step.id}
                                            step={step}
                                            isLast={index === arr.length - 1}
                                        />
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
