import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  Eye,
  FileIcon
} from 'lucide-react';
import { updateDocument } from '@/services/documents/documents.api';
import { Button } from '@/components/ui/button';

interface Assignature {
  id: number;
  name: string;
  sign_img: string;
  status: boolean;
  signed_date: string | null;
}

interface ApiDocument {
  id: number;
  name: string;
  status: number;
  date_created: string;
  last_modified: string;
  created_by: number | string;
  submitted_by: string;
  template: number;
  document_data: Record<string, string>;
  assignatures: Assignature[];
  remarks: string | { note: string };
  department: string;
  tracking_id: string;
  to_route: number;
  type?: string; // for file icon
}

interface DocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: ApiDocument | null;
  mode: 'view' | 'edit';
  onSave?: (document: ApiDocument) => void;
  getDocuments?: () => Promise<void>;
}

// Removed status 4 (Declined)
const statusMap: Record<number, { label: string; color: string; icon: JSX.Element }> = {
  1: {
    label: 'For Approval',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="w-5 h-5 text-blue-600" />
  },
  2: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />
  },
  3: {
    label: 'Completed',
    color: 'bg-green-500 text-white',
    icon: <CheckCircle className="w-5 h-5 text-green-800" />
  }
};

const getStatus = (status: number) =>
  statusMap[status] || {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <FileText className="w-5 h-5 text-gray-600" />
  };

// Removed Declined from stepperSteps
const stepperSteps = [
  { key: 1, label: 'For Approval' },
  { key: 2, label: 'Approved' },
  { key: 3, label: 'Completed' }
];

function getFileIcon(type?: string) {
  if (!type) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <FileText className="w-6 h-6 text-gray-600" />
      </div>
    );
  }
  switch (type.toLowerCase()) {
    case 'pdf':
      return (
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <FileIcon className="w-6 h-6 text-red-600" />
        </div>
      );
    case 'docx':
    case 'doc':
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
      );
    case 'xlsx':
    case 'xls':
      return (
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <FileIcon className="w-6 h-6 text-green-600" />
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-gray-600" />
        </div>
      );
  }
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  getDocuments,
  isOpen,
  onClose,
  document,
  mode,
  onSave,
}) => {
  const [editedDocument, setEditedDocument] = useState<ApiDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setEditedDocument({ ...document });
      setIsEditing(mode === 'edit');
    }
  }, [document, mode]);

  if (!isOpen || !document || !editedDocument) return null;

  const status = getStatus(editedDocument.status);
  const currentStepIndex = stepperSteps.findIndex(s => Number(s.key) === Number(editedDocument.status));

  const handleApprove = async () => {
    setLoading(true);
    try {
      const updated = await updateDocument(String(editedDocument.id), { status: 2 });
      setEditedDocument(updated as unknown as ApiDocument);
      if (getDocuments) await getDocuments();
      if (onSave) onSave(updated as unknown as ApiDocument);
    } finally {
      setLoading(false);
    }
  };

  // Remove status 4 (Declined) from canApprove logic
  const canApprove = editedDocument.status !== 2 && editedDocument.status !== 3;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8 flex flex-col">
        {/* Stepper for Status */}
        <div className="w-full px-6 pt-6 pb-2 bg-blue-50 border-b border-blue-200 flex flex-col">
          <div className="flex items-center justify-center gap-4">
            {stepperSteps.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200 ${isActive ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-400'} ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}>
                    {isActive ? <CheckCircle className="w-5 h-5 text-white" /> : getStatus(step.key).icon}
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
          <div className="flex justify-center mt-3 mb-1">
            <span className="text-sm text-green-600 font-medium text-center italic">
              {status.label}
            </span>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {getFileIcon(editedDocument.type as string)}
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">Tracking ID: {editedDocument.tracking_id || '-'}</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {editedDocument.name ? editedDocument.name : 'Document Details'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Modify document information' : 'View document information'}
              </p>
            </div>
          </div>
          {/* <div className="flex items-center space-x-2">
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
          </div> */}
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1  lg:grid-cols-2 gap-8">
            {/* Left Column - Document Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Document Name</label>
                  <span className="text-gray-900 font-medium">{editedDocument.name}</span>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                  <span className="text-gray-700">{editedDocument.department || '-'}</span>
                </div>
                <div className="flex flex-col mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Submitted By</label>
                  <span className="text-gray-700">{editedDocument.submitted_by || '-'}</span>
                </div>
                <div className="flex flex-col mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    {status.icon}
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Document Content
                </label>
                <div className="bg-gray-50 rounded p-2 text-xs divide-y divide-gray-200">
                  {editedDocument.document_data && Object.entries(editedDocument.document_data).length > 0 ? (
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
                  )}
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
                        <span className="ml-2 flex items-center">
                          {a.sign_img && (
                            <img src={a.sign_img} alt="sign" className="h-5 w-16 object-contain border rounded bg-white" />
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
          <div>
            {canApprove && (
              <Button
                className="px-4 py-2 border w-full border-blue-500 text-blue-700 bg-white rounded-md text-sm font-medium hover:bg-blue-50 mr-4"
                onClick={handleApprove}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Approving...' : 'Approve'}
              </Button>
            )}
          </div>
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
              disabled={loading}
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