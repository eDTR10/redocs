import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    FileText,
    Download,
    Calendar,
    User,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Eye,
    FileIcon
} from 'lucide-react';

interface DocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: any | null;
    mode: 'view' | 'edit';
    onSave?: (document: any) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
    isOpen,
    onClose,
    document,
}) => {
    const [editedDocument, setEditedDocument] = useState<any | null>(null);

    useEffect(() => {
        if (document) {
            setEditedDocument({ ...document });
        }
    }, [document]);

    if (!isOpen || !document || !editedDocument) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'In-Route': return <Truck className="w-5 h-5 text-blue-600" />;
            case 'Approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'Declined': return <XCircle className="w-5 h-5 text-red-600" />;
            default: return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'In-Route': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Declined': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getFileIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'pdf':
                return <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-red-600" />
                </div>;
            case 'docx':
            case 'doc':
                return <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                </div>;
            case 'xlsx':
            case 'xls':
                return <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-green-600" />
                </div>;
            default:
                return <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600" />
                </div>;
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        {getFileIcon(editedDocument.type)}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Document Details
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                View document information
                            </p>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Document Information */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document Name
                                </label>
                                <p className="text-gray-900 font-medium">{editedDocument.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <p className="text-gray-700">
                                    {editedDocument.description || 'No description available.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Document Type
                                    </label>
                                    <p className="text-gray-700">{editedDocument.type}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File Size
                                    </label>
                                    <p className="text-gray-700">{editedDocument.size}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(editedDocument.status)}
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(editedDocument.status)}`}>
                                        {editedDocument.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Metadata */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Metadata</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Created</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(editedDocument.dateCreated).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Last Modified</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(editedDocument.lastModified).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Created By</p>
                                            <p className="text-sm text-gray-600">
                                                {editedDocument.createdBy || 'System User'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Document ID</p>
                                            <p className="text-sm text-gray-600 font-mono">
                                                {editedDocument.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Document Preview Area */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h3>
                                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-sm">
                                        Preview not available for {editedDocument.type} files
                                    </p>
                                    <button className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download to View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Eye className="w-4 h-4 mr-2" />
                            View Full
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                              Close
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        window.document.body
    );
};

export default DocumentDialog;