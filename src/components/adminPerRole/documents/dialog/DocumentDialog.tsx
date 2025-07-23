import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileIcon
} from 'lucide-react';
import { updateDocument } from '@/services/documents/documents.api';

interface Assignature {
  id: number;
  name: string;
  sign_img: string;
  status: boolean;
  signed_date: string | null;
}

interface DocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: ApiDocument | null;
  mode: 'view' | 'edit';
  onSave?: (document: ApiDocument) => void;
  getDocuments?: () => Promise<void>;
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
  remarks: {
    note: string;
  };
  department: string;
  tracking_id: string;
  to_route: number;
}

const statusMap: Record<number, { label: string; color: string; icon: JSX.Element }> = {
  1: {
    label: 'For Approval',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="w-5 h-5 text-yellow-600" />
  },
  2: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />
  },
  3: {
    label: 'Completed with PR Number',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle className="w-5 h-5 text-blue-600" />
  },
  4: {
    label: 'Declined',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="w-5 h-5 text-red-600" />
  }
};

const getStatus = (status: number) =>
  statusMap[status] || {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <FileText className="w-5 h-5 text-gray-600" />
  };

const getFileIcon = (type: string | undefined) => {
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
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  getDocuments,
  isOpen,
  onClose,
  document,
  onSave,
}: any) => {
  const [editedDocument, setEditedDocument] = useState<ApiDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveSuccess, setApproveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setEditedDocument({ ...document });
      setApproveError(null);
      setApproveSuccess(null);
    }
  }, [document]);

  if (!isOpen || !document || !editedDocument) return null;

  const status = getStatus(editedDocument.status);

  const handleApprove = async () => {
    setLoading(true);
    setApproveError(null);
    setApproveSuccess(null);
    try {
      const updated = await updateDocument(String(editedDocument.id), { status: 2 });
      setEditedDocument(updated as unknown as ApiDocument);
      setApproveSuccess('Document approved successfully!');
      if (getDocuments) await getDocuments();
      if (onSave) onSave(updated as unknown as ApiDocument);
    } catch (error: any) {
      setApproveError(
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to approve document.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canApprove = editedDocument.status !== 2 && editedDocument.status !== 3 && editedDocument.status !== 4;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden my-8 flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center space-x-4">
            {getFileIcon('pdf')}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {editedDocument.name}
              </h2>
              <div className="flex items-center mt-1 space-x-2">
                <span className="flex items-center text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Tracking ID:
                </span>
                <span className="ml-2 px-3 py-1 rounded-full font-mono font-bold text-xs shadow-sm border border-blue-200 tracking-widest">
                  {editedDocument.tracking_id}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-white">
          {/* Feedback messages */}
          {approveError && (
            <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-700 border border-red-200">
              {approveError}
            </div>
          )}
          {approveSuccess && (
            <div className="mb-4 px-4 py-2 rounded bg-green-100 text-green-700 border border-green-200">
              {approveSuccess}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Document Information */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <p className="text-gray-800 text-base">
                  {editedDocument.remarks?.note || 'No description available.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Department
                </label>
                <p className="text-gray-800">{editedDocument.department}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Submitted By
                </label>
                <p className="text-gray-800">{editedDocument.submitted_by}</p>
              </div>

              {/* Status Badge Row */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  {status.icon}
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Conditionally show document_data if status is 3 */}
              {editedDocument.status === 3 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                    Document Data
                  </label>
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <dl>
                      {Object.entries(editedDocument.document_data).map(([key, value], idx) => (
                        <div
                          key={key}
                          className={`grid grid-cols-2 gap-2 px-4 py-3 items-center ${
                            idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <dt className="text-gray-600 text-sm font-medium">{key}</dt>
                          <dd className="text-gray-900 text-sm text-right break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Metadata & Signatures */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 border border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 text-sm font-bold">
                      Created: {new Date(editedDocument.date_created).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 text-sm font-bold">
                      Last Modified: {new Date(editedDocument.last_modified).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 text-sm font-bold">
                      Created By: {typeof editedDocument.created_by === 'string' ? editedDocument.created_by : `User #${editedDocument.created_by}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Signatures</h3>
                {editedDocument.assignatures.length === 0 ? (
                  <div className="text-gray-500 text-sm">No signatures yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {editedDocument.assignatures.map((sig) => (
                      <li key={sig.id} className="flex items-center space-x-3">
                        <img
                          src={sig.sign_img}
                          alt={sig.name}
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{sig.name}</div>
                          <div className="text-xs text-gray-500">
                            {sig.status
                              ? (
                                <>
                                  <CheckCircle className="inline w-4 h-4 text-green-500 mr-1" />
                                  Signed {sig.signed_date ? `on ${new Date(sig.signed_date).toLocaleDateString()}` : ''}
                                </>
                              )
                              : (
                                <>
                                  <Clock className="inline w-4 h-4 text-yellow-500 mr-1" />
                                  Pending
                                </>
                              )
                            }
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {canApprove && (
              <button
                className="inline-flex items-center px-4 py-2 border border-green-400 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition disabled:opacity-50"
                onClick={handleApprove}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Approving...' : 'Approve'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
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