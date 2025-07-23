// Usage example for updating a document from a parent component:
//
// import { updateDocument } from '@/services/documents/documents.api';
//
// const handleSave = async (updatedDoc: FilledDocument) => {
//   await updateDocument(updatedDoc.id, updatedDoc);
//   // Optionally: refresh data, close dialog, show notification, etc.
// };
//
// <DocumentDialog
//   isOpen={isOpen}
//   onClose={handleClose}
//   document={selectedDocument}
//   mode={mode}
//   onSave={handleSave}
// />
import { useState, useEffect } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Helper to get Cloudinary image URL by public_id (should include folder and extension)
function getCloudinaryImageUrl(publicId: string): string {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    // publicId should be 'signatures/<baseName>.<ext>'
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}
import { createPortal } from 'react-dom';
import {
    X,
    FileText,
    Download,
    Edit,
    Save,
    Calendar,
    User,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Eye,
    FileIcon
} from 'lucide-react';
import { FilledDocument, Assignature, statusDescriptionMap } from '../../../../../interfaces/Document';

interface DocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: FilledDocument | null;
    mode: 'view' | 'edit';
    onSave?: (document: FilledDocument) => void;
    statusMap?: Record<string | number, { label: string; color: string; icon: JSX.Element }>;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
    isOpen,
    onClose,
    document,
    mode,
    onSave,
    statusMap
}) => {
    const [editedDocument, setEditedDocument] = useState<FilledDocument | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (document) {
            setEditedDocument({ ...document });
            setIsEditing(mode === 'edit');
        }
    }, [document, mode]);

    if (!isOpen || !document || !editedDocument) return null;

    const handleSave = async () => {
        if (!editedDocument) return;
        // For each assignature, set sign_img to Cloudinary URL (if found) using a.name
        const updatedAssignatures = await Promise.all(
            editedDocument.assignatures.map(async (a) => {
                if (!a.name) return a;
                const baseName = a.name.replace(/[^a-zA-Z0-9]/g, '_');
                const tryExts = ['png', 'jpg', 'jpeg', 'webp'];
                let foundUrl = '';
                for (const ext of tryExts) {
                    const publicId = `signatures/${baseName}.${ext}`;
                    const url = getCloudinaryImageUrl(publicId);
                    try {
                        const res = await fetch(url, { method: 'HEAD' });
                        if (res.ok) {
                            foundUrl = url;
                            break;
                        }
                    } catch { }
                }
                // Always set sign_img to Cloudinary URL if found, otherwise keep the current value
                return { ...a, sign_img: foundUrl || a.sign_img };
            })
        );
        const updatedDoc = { ...editedDocument, assignatures: updatedAssignatures, status: 2 };
        if (onSave) onSave(updatedDoc);
        setIsEditing(false);
    };

    const handleInputChange = (field: keyof FilledDocument, value: any) => {
        if (editedDocument) {
            setEditedDocument({
                ...editedDocument,
                [field]: value
            });
        }
    };

    // Use the same statusMap as in MyDocuments for color and label
    const localStatusMap: Record<string | number, { label: string; color: string; icon: JSX.Element }> = {
        1: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-5 h-5 text-blue-600" /> },
        2: { label: 'For PR Number', color: 'bg-green-100 text-green-700', icon: <Clock className="w-5 h-5 text-green-700" /> },
        3: { label: 'Completed', color: 'bg-green-500 text-white', icon: <CheckCircle className="w-5 h-5 text-green-800" /> },
    };
    const getStatusIcon = (status: string | number) => (statusMap || localStatusMap)[status]?.icon || <FileText className="w-5 h-5 text-gray-600" />;
    const getStatusBadgeColor = (status: string | number) => (statusMap || localStatusMap)[status]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
    const getStatusLabel = (status: string | number) => (statusMap || localStatusMap)[status]?.label || status;

    const getFileIcon = (type?: string) => {
        if (!type) return <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-gray-600" /></div>;
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

    // Stepper for status
    const stepperSteps = [
        { key: 1, label: 'Submitted' },
        { key: 2, label: 'For PR Number' },
        { key: 3, label: 'Completed' },
    ];
    const currentStepIndex = stepperSteps.findIndex(s => String(s.key) === String(editedDocument.status));

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8 flex flex-col">
                {/* Stepper for Status */}
                {!isEditing && (
                    <div className="w-full px-6 pt-6 pb-2 bg-blue-50 border-b border-blue-200 flex flex-col">
                        <div className="flex items-center justify-center gap-4">
                            {stepperSteps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                return (
                                    <div key={step.key} className="flex items-center">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200 ${isActive ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-400'} ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}>
                                            {isActive ? <CheckCircle className="w-5 h-5 text-white" /> : getStatusIcon(step.key)}
                                        </div>
                                        {idx < stepperSteps.length - 1 && (
                                            <div className={`w-10 h-1 ${idx < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'} mx-1 rounded`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-8 mt-2">
                            {stepperSteps.map((step, idx) => (
                                <span key={step.key} className={`text-xs font-medium ${idx === currentStepIndex ? 'text-green-700' : 'text-gray-400'}`}>{step.label}</span>
                            ))}
                        </div>
                        {/* Last status description below the stepper */}
                        <div className="flex justify-center mt-3 mb-1">
                            <span className="text-sm text-green-600 font-medium text-center italic">
                                {typeof statusDescriptionMap === 'object' && typeof statusDescriptionMap[Number(editedDocument.status)] === 'function'
                                    ? statusDescriptionMap[Number(editedDocument.status)](editedDocument)
                                    : getStatusLabel(editedDocument.status)}
                            </span>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        {getFileIcon(editedDocument.type as string)}
                        <div>
                            {/* Tracking Number above Document Name */}
                            <p className="text-xs text-gray-400 font-mono mb-1">Tracking ID: {editedDocument.tracking_id || '-'}</p>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editedDocument.name ? editedDocument.name : 'Document Details'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditing ? 'Modify document information' : 'View document information'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing && mode === 'view' && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </button>
                        )}
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
                    <div className="grid grid-cols-1  lg:grid-cols-2 gap-8">
                        {/* Left Column - Document Information */}

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-2">

                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Document Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedDocument.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    ) : (
                                        <span className="text-gray-900 font-medium">{editedDocument.name}</span>
                                    )}
                                </div>
                                {/* Department */}
                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedDocument.department || ''}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    ) : (
                                        <span className="text-gray-700">{editedDocument.department || '-'}</span>
                                    )}
                                </div>
                                {/* Submitted By */}
                                <div className="flex flex-col mt-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Submitted By</label>
                                    <span className="text-gray-700">{editedDocument.submitted_by || '-'}</span>
                                </div>
                                {/* Status */}
                                <div className="flex flex-col mt-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                    {isEditing ? (
                                        <select
                                            value={editedDocument.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        >
                                            {Object.entries(statusMap || localStatusMap).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(editedDocument.status)}
                                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(editedDocument.status)}`}>
                                                {getStatusLabel(editedDocument.status)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tracking ID
                                </label>
                                <p className="text-gray-700 font-mono">{editedDocument.tracking_id || '-'}</p>
                            </div> */}

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template
                                </label>
                                <p className="text-gray-700">{editedDocument.template || '-'}</p>
                            </div> */}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Document Content
                                </label>
                                <div className="bg-gray-50 rounded p-2 text-xs divide-y divide-gray-200">
                                    {isEditing ? (
                                        editedDocument.document_data && Object.entries(editedDocument.document_data).length > 0 ? (
                                            Object.entries(editedDocument.document_data).map(([k, v], idx) => (
                                                <div
                                                    key={k}
                                                    className={`flex items-center gap-2 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} rounded-md px-2`}
                                                >
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mr-2">
                                                        <FileText className="w-4 h-4" />
                                                    </span>
                                                    <span className="font-semibold text-gray-800 min-w-[90px]">{k}:</span>
                                                    <input
                                                        type="text"
                                                        value={String(v)}
                                                        onChange={e => {
                                                            setEditedDocument(prev => prev ? {
                                                                ...prev,
                                                                document_data: {
                                                                    ...prev.document_data,
                                                                    [k]: e.target.value
                                                                }
                                                            } : prev);
                                                        }}
                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 text-xs"
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-gray-400">No document data</span>
                                        )
                                    ) : (
                                        editedDocument.document_data && Object.entries(editedDocument.document_data).length > 0 ? (
                                            Object.entries(editedDocument.document_data).map(([k, v], idx) => (
                                                <div
                                                    key={k}
                                                    className={`flex items-center gap-2 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} rounded-md px-2`}
                                                >
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mr-2">
                                                        <FileText className="w-4 h-4" />
                                                    </span>
                                                    <span className="font-semibold text-gray-800 min-w-[90px]">{k}:</span>
                                                    <span className="text-gray-700 break-all">{String(v)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-gray-400">No document data</span>
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Assignatures
                                </label>
                                <div className="bg-gray-50 rounded p-2 text-xs divide-y divide-gray-200">
                                    {editedDocument.assignatures && editedDocument.assignatures.length > 0 ? (
                                        editedDocument.assignatures.map((a: Assignature, idx: number) => (
                                            <div
                                                key={a.id || idx}
                                                className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 py-2 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} rounded-md px-2`}
                                            >
                                                {/* Left col: Icon, ID, Name */}
                                                <span className="ml-2 flex items-center">
                                                    {a.sign_img && (
                                                        <img src={a.sign_img} alt="sign" className="h-5 w-16 object-contain border rounded bg-white" />
                                                    )}
                                                    {isEditing && (
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="ml-2 text-xs"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                // Optionally: show loading indicator
                                                                try {
                                                                    // Rename the file to match a.name (preserve extension)
                                                                    let renamedFile = file;
                                                                    let publicId = undefined;
                                                                    if (a?.name) {
                                                                        const ext = file.name.split('.').pop();
                                                                        const baseName = a.name.replace(/[^a-zA-Z0-9]/g, '_');
                                                                        const newName = `${baseName}.${ext}`;
                                                                        renamedFile = new File([file], newName, { type: file.type });
                                                                        // Avoid double 'signatures/'
                                                                        publicId = baseName.startsWith('signatures/') ? baseName : `signatures/${baseName}`;
                                                                    }
                                                                    // Pass publicId to uploadToCloudinary
                                                                    const url = await uploadToCloudinary(renamedFile, publicId);
                                                                    setEditedDocument(prev => {
                                                                        if (!prev) return prev;
                                                                        const newAssignatures = prev.assignatures.map((item, i) =>
                                                                            i === idx ? { ...item, sign_img: url } : item
                                                                        );
                                                                        return { ...prev, assignatures: newAssignatures };
                                                                    });
                                                                } catch (err) {
                                                                    alert('Failed to upload signature image.');
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </span>
                                                {a.signed_date && (
                                                    <span className="ml-2 text-gray-500 italic">({a.signed_date})</span>
                                                )}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {a.name && (
                                                        <>
                                                            <span className="font-semibold text-gray-800">Name:</span>
                                                            <span className="text-gray-700 truncate max-w-[300px]">{a.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Right col: Status, Signature, Date */}
                                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                    <span className="font-semibold text-gray-800">Status:</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>
                                                        {a.status ? 'Signed' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : <span className="text-gray-400">No assignatures</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-md font-medium text-green-700 mb-2">
                                    Remarks
                                </label>
                                <div className="bg-gray-50 rounded p-2 text-xs">
                                    {(() => {
                                        if (!editedDocument.remarks || (typeof editedDocument.remarks === 'object' && Object.keys(editedDocument.remarks).length === 0)) {
                                            return <span>No remarks</span>;
                                        }
                                        if (typeof editedDocument.remarks === 'string') {
                                            return <span>{editedDocument.remarks}</span>;
                                        }
                                        if (typeof editedDocument.remarks === 'object') {
                                            return Object.entries(editedDocument.remarks).map(([k, v]) => (
                                                <div key={k}><span className="font-semibold">{k}:</span> {String(v)}</div>
                                            ));
                                        }
                                        return <span>No remarks</span>;
                                    })()}
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
                                                {editedDocument.date_created ? new Date(editedDocument.date_created).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Last Modified</p>
                                            <p className="text-sm text-gray-600">
                                                {editedDocument.last_modified ? new Date(editedDocument.last_modified).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Created By</p>
                                            <p className="text-sm text-gray-600">
                                                {editedDocument.submitted_by || 'System User'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* <div className="flex items-center space-x-3">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Document ID</p>
                                            <p className="text-sm text-gray-600 font-mono">
                                                {editedDocument.id || '-'}
                                            </p>
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* Document Preview Area */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h3>
                                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-sm">
                                        Preview not available
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
                    {/* Approve button at the far left */}
                    {isEditing ? (
                        <button
                            className="px-4 py-2 border border-blue-500 text-blue-700 bg-white rounded-md text-sm font-medium hover:bg-blue-50 mr-4"
                            onClick={async () => {
                                if (!editedDocument) return;
                                // For each assignature, set sign_img to Cloudinary URL (if found) using a.name
                                const updatedAssignatures = await Promise.all(
                                    editedDocument.assignatures.map(async (a) => {
                                        if (!a.name) return a;
                                        const baseName = a.name.replace(/[^a-zA-Z0-9]/g, '_');
                                        const tryExts = ['png', 'jpg', 'jpeg', 'webp'];
                                        let foundUrl = '';
                                        for (const ext of tryExts) {
                                            const publicId = `signatures/${baseName}.${ext}`;
                                            const url = getCloudinaryImageUrl(publicId);
                                            try {
                                                const res = await fetch(url, { method: 'HEAD' });
                                                if (res.ok) {
                                                    foundUrl = url;
                                                    break;
                                                }
                                            } catch { }
                                        }
                                        // Always set sign_img to Cloudinary URL if found, otherwise clear it
                                        return { ...a, sign_img: foundUrl || '' };
                                    })
                                );
                                setEditedDocument(prev => prev ? { ...prev, assignatures: updatedAssignatures } : prev);
                            }}
                        >
                            Approve
                        </button>
                    ) : (
                        <div />
                    )}

                    {/* Center group: Download/ViewFull (when not editing) */}
                    <div className="flex items-center space-x-2">
                        {!isEditing && (
                            <>
                                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </button>
                                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Full
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right group: Cancel/Save Changes (when editing) or Close (when not editing) */}
                    <div className="flex items-center space-x-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => { await handleSave(); }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </button>
                                {/* Show Approve & Save when editing and assignatures exist */}
                                {isEditing && editedDocument && editedDocument.assignatures && editedDocument.assignatures.length > 0 && (
                                    <button
                                        className="ml-2 px-4 py-2 border border-blue-500 text-blue-700 bg-white rounded-md text-sm font-medium hover:bg-blue-50"
                                        onClick={async () => {
                                            if (!editedDocument) return;
                                            const updatedAssignatures = await Promise.all(
                                                editedDocument.assignatures.map(async (a) => {
                                                    if (!a.name) return a;
                                                    const baseName = a.name.replace(/[^a-zA-Z0-9]/g, '_');
                                                    const tryExts = ['png', 'jpg', 'jpeg', 'webp'];
                                                    let foundUrl = '';
                                                    for (const ext of tryExts) {
                                                        const publicId = `signatures/${baseName}.${ext}`;
                                                        const url = getCloudinaryImageUrl(publicId);
                                                        try {
                                                            const res = await fetch(url, { method: 'HEAD' });
                                                            if (res.ok) {
                                                                foundUrl = url;
                                                                break;
                                                            }
                                                        } catch { }
                                                    }
                                                    return { ...a, sign_img: foundUrl || '' };
                                                })
                                            );
                                            setEditedDocument(prev => prev ? { ...prev, assignatures: updatedAssignatures } : prev);
                                            // Now call handleSave to persist
                                            setTimeout(() => handleSave(), 0);
                                        }}
                                    >
                                        Approve & Save
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        window.document.body
    );
};

export default DocumentDialog;
