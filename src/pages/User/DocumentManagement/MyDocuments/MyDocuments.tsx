import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    ArrowUpDown,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Hand
} from 'lucide-react';
import DocumentDialog from './dialogs/DocumentDialog';
import { FilledDocument } from '../../../../interfaces/Document';
import { fetchDocuments, deleteDocument, updateDocument } from '@/services/documents/documents.api';

const MyDocuments = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortField, setSortField] = useState<keyof FilledDocument>('date_created');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Data state
    const [documents, setDocuments] = useState<FilledDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FilledDocument | null>(null);
    const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingDocument, setDeletingDocument] = useState<FilledDocument | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);


    // Fetch documents from API
    useEffect(() => {
        setLoading(true);
        fetchDocuments()
            .then((data) => {
                setDocuments(data);
                setError(null);
            })
            .catch((err) => {
                setError('Failed to fetch documents');
            })
            .finally(() => setLoading(false));
    }, []);

    // Dialog handlers

    const handleViewDocument = (document: FilledDocument) => {
        setSelectedDocument(document);
        setDialogMode('view');
        setIsDialogOpen(true);
    };

    const handleEditDocument = (document: FilledDocument) => {
        setSelectedDocument(document);
        setDialogMode('edit');
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedDocument(null);
    };


    const handleSaveDocument = async (updatedDocument: FilledDocument) => {
        try {
            await updateDocument(updatedDocument.id, updatedDocument);
            setDocuments(prevDocs => prevDocs.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc));
        } catch (err) {
            setError('Failed to update document.');
        } finally {
            handleCloseDialog();
        }
    };


    const handleDownloadDocument = (document: FilledDocument) => {
        // TODO: Implement download logic
        console.log('Downloading document:', document.name);
    };


    const handleDeleteDocument = (document: FilledDocument) => {
        setDeletingDocument(document);
        setIsDeleteModalOpen(true);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingDocument) return;
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            await deleteDocument(deletingDocument.id);
            setDocuments(prev => prev.filter(doc => doc.id !== deletingDocument.id));
            setIsDeleteModalOpen(false);
            setDeletingDocument(null);
        } catch (err) {
            setDeleteError('Failed to delete document.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setDeletingDocument(null);
        setDeleteError(null);
    };


    // Filtered and sorted documents
    const filteredAndSortedDocuments = useMemo(() => {
        let filtered = documents.filter(doc => {
            const matchesSearch =
                doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.tracking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.submitted_by?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === '' || String(doc.status) === statusFilter;
            const matchesDepartment = departmentFilter === '' || (doc.department || '').toLowerCase() === departmentFilter.toLowerCase();
            const matchesDate = dateFilter === '' || (doc.date_created || '').slice(0, 7) === dateFilter;
            return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
        });

        // Sort documents
        filtered.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];
            if (sortField === 'date_created' || sortField === 'last_modified') {
                aValue = new Date(aValue as string).getTime();
                bValue = new Date(bValue as string).getTime();
            }
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [documents, searchTerm, statusFilter, departmentFilter, dateFilter, sortField, sortDirection]);


    const handleSort = (field: keyof FilledDocument) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };


    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDepartmentFilter('');
        setDateFilter('');
    };


    // Status mapping (1-blue, 2-semi-green, 3-green)
    const statusMap: Record<string | number, { label: string; color: string; icon: JSX.Element }> = {
        1: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4 text-blue-600" /> },
        2: { label: 'For PR Number', color: 'bg-green-100 text-green-700', icon: <Hand className="w-4 h-4 text-green-700" /> },
        3: { label: 'Completed', color: 'bg-green-500 text-white', icon: <CheckCircle className="w-4 h-4 text-green-900" /> },
    };
    const getStatusIcon = (status: string | number) => statusMap[status]?.icon || <FileText className="w-4 h-4 text-gray-600" />;
    const getStatusBadgeColor = (status: string | number) => statusMap[status]?.color || 'bg-gray-100 text-gray-800';


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Documents</h1>
                        <p className="text-gray-600">Manage and track all your documents in one place.</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        {loading ? 'Loading...' : `Showing ${filteredAndSortedDocuments.length} of ${documents.length} documents`}
                    </div>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col  gap-4 mb-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, tracking ID, or submitter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">All Status</option>
                            <option value="1">Pending</option>
                            <option value="2">In-Route</option>
                            <option value="3">Approved</option>
                            <option value="4">Declined</option>
                        </select>

                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">All Departments</option>
                            {/* Optionally map unique departments from documents */}
                            {[...new Set(documents.map(d => d.department).filter(Boolean))].map(dep => (
                                <option key={dep} value={dep as string}>{dep}</option>
                            ))}
                        </select>

                        <input
                            type="month"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />

                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Filter className="w-4 h-4 mr-2 inline" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className=" w-max-[10%]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking ID</th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Document Name
                                        <ArrowUpDown className="w-4 h-4 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th> */}
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        <ArrowUpDown className="w-4 h-4 ml-1" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('date_created')}
                                >
                                    <div className="flex items-center">
                                        Created
                                        <ArrowUpDown className="w-4 h-4 ml-1" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('last_modified')}
                                >
                                    <div className="flex items-center">
                                        Modified
                                        <ArrowUpDown className="w-4 h-4 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">No documents found</p>
                                        <p>Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.tracking_id || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-gray-100 rounded-lg p-2 mr-3">
                                                    <FileText className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.department || '-'}</td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.submitted_by || '-'}</td> */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(doc.status)}
                                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(doc.status)}`}>
                                                    {statusMap[doc.status]?.label || doc.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.date_created ? new Date(doc.date_created).toLocaleDateString() : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.last_modified ? new Date(doc.last_modified).toLocaleDateString() : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDocument(doc)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadDocument(doc)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Document Dialog */}
            <DocumentDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                document={selectedDocument}
                mode={dialogMode}
                onSave={handleSaveDocument}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && deletingDocument && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Document</h2>
                        <p className="text-gray-700 mb-4">Are you sure you want to delete <span className="font-bold">{deletingDocument.name}</span>? This action cannot be undone.</p>
                        {deleteError && <div className="text-red-500 mb-2">{deleteError}</div>}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyDocuments;
