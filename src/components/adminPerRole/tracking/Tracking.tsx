import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MapPin, Clock, CheckCircle, XCircle, AlertCircle, FileText, Search, Filter
} from 'lucide-react';

interface Assignature {
  id: number;
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
  remarks: {
    note: string;
  };
  department: string;
  tracking_id: string;
  to_route: number;
}

const STATUS_MAP: Record<number, { label: string; color: string; icon: JSX.Element }> = {
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
    label: 'Completed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle className="w-5 h-5 text-blue-600" />
  },
  4: {
    label: 'Declined',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="w-5 h-5 text-red-600" />
  }
};

const getStatusBadgeColor = (status: number) => {
  switch (status) {
    case 1: // For Approval
      return 'bg-blue-100 text-blue-800';
    case 2: // Approved
    case 3: // Completed
      return 'bg-green-100 text-green-800';
    case 4: // Declined
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function getStatus(status: number) {
  return STATUS_MAP[status] || {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <AlertCircle className="w-5 h-5 text-gray-400" />
  };
}

type TrackingStep = {
  title: string;
  description: string;
  status: string;
  date: string | null;
  icon: JSX.Element;
  sign_img?: string;
};

const Tracking: React.FC = () => {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ApiDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ref for Tracking Progress section
  const trackingProgressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setError(null);
        const response = await axios.get<ApiDocument[]>(
          'document/all',
          {
            headers: {
              Authorization: `Token ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json',
            }
          }
        );
        setDocuments(response.data);
        setSelectedDocument(response.data[0] || null);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to fetch documents.'
        );
      }
    };
    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tracking_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === '' ||
      getStatus(doc.status).label === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function buildTrackingSteps(doc: ApiDocument): TrackingStep[] {
    const steps: TrackingStep[] = [
      {
        title: 'Submitted',
        description: `Submitted by ${doc.submitted_by}`,
        status: 'completed',
        date: doc.date_created,
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        sign_img: undefined,
      },
      ...doc.assignatures.map((sig, idx) => ({
        title: `Signature ${idx + 1}`,
        description: sig.status
          ? `Signed by ${sig.id} on ${sig.signed_date ? new Date(sig.signed_date).toLocaleString() : ''}`
          : `Waiting for signature`,
        status: sig.status ? 'completed' : 'pending',
        date: sig.signed_date,
        icon: sig.status
          ? <CheckCircle className="w-6 h-6 text-green-500" />
          : <Clock className="w-6 h-6 text-yellow-500" />,
        sign_img: sig.sign_img,
      })),
      {
        title: getStatus(doc.status).label,
        description: doc.remarks?.note || '',
        status:
          doc.status === 2 || doc.status === 3
            ? 'completed'
            : doc.status === 4
            ? 'rejected'
            : 'current',
        date: doc.last_modified,
        icon:
          doc.status === 2 || doc.status === 3
            ? <CheckCircle className="w-6 h-6 text-green-500" />
            : doc.status === 4
            ? <XCircle className="w-6 h-6 text-red-500" />
            : <Clock className="w-6 h-6 text-blue-500" />,
        sign_img: undefined,
      }
    ];
    return steps;
  }

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

  // Scroll to Tracking Progress when a document is selected
  const handleSelectDocument = (document: ApiDocument) => {
    setSelectedDocument(document);
    setTimeout(() => {
      trackingProgressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
            <option value="For Approval">For Approval</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Declined">Declined</option>
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        {error && (
          <div className="mt-4 px-4 py-2 rounded bg-red-100 text-red-700 border border-red-200">
            {error}
          </div>
        )}
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
          onClick={() => handleSelectDocument(document)}
          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedDocument?.id === document.id ? 'bg-purple-50 border-purple-200' : ''
          }`}
        >
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-gray-400 mt-1 mr-3" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {document.name}
              </h4>
              <p className="text-sm text-gray-500">{document.tracking_id}</p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(document.status)}`}
                >
                  {getStatus(document.status).label}
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
                        <span className="font-medium">Department:</span> {selectedDocument.department}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted by:</span> {selectedDocument.submitted_by}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date Submitted:</span> {new Date(selectedDocument.date_created).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {getStatus(selectedDocument.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="p-6" ref={trackingProgressRef}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Progress</h3>
                <div className="space-y-4">
                  {buildTrackingSteps(selectedDocument).map((step, index, arr) => (
                    <div key={index} className="relative">
                      {/* Connector Line */}
                      {index < arr.length - 1 && (
                        <div className="absolute left-3 top-10 w-0.5 h-16 bg-gray-300"></div>
                      )}

                      <div className={`relative flex items-start p-4 rounded-lg border-2 ${getStepColor(step.status)}`}>
                        <div className="flex-shrink-0 mr-4">
                          {step.icon}
                          {step.sign_img && (
                            <img
                              src={step.sign_img}
                              alt="Signature"
                              className="w-8 h-8 rounded-full border mt-2"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {step.title}
                            </h4>
                            {step.date && (
                              <span className="text-xs text-gray-500">
                                {typeof step.date === 'string'
                                  ? new Date(step.date).toLocaleString()
                                  : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
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

export default Tracking;