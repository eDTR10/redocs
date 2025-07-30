import { Filter, Search, ArrowUpDown, Eye, Download, FileText, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DocumentDialog from "./dialog/DocumentDialog";
import { fetchDocuments } from '@/services/documents/documents.api';

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
  remarks: {
    note: string;
  };
  department: string;
  tracking_id: string;
  to_route: number;
}

type SortField = keyof ApiDocument | "";
type SortDirection = "asc" | "desc";

function Document() {
  const [documentTemplate, setDocumentTemplate] = useState<ApiDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [selectedDocument, setSelectedDocument] = useState<ApiDocument | null>(null);

  // Use useCallback to ensure stable reference for getDocuments
  const getDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments(
        undefined,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          }
        }
      );
      // Map API response to ApiDocument[]
      const mappedDocs: ApiDocument[] = docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        date_created: doc.date_created,
        last_modified: doc.last_modified,
        created_by: doc.created_by,
        submitted_by: doc.submitted_by,
        template: doc.template,
        document_data: doc.document_data,
        assignatures: doc.assignatures,
        remarks: doc.remarks,
        department: doc.department,
        tracking_id: doc.tracking_id,
        to_route: doc.to_route,
      }));
      setDocumentTemplate(mappedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, []);

  useEffect(() => {
    getDocuments();
  }, [getDocuments]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFilter('');
  };

  const handleViewDocument = (document: ApiDocument) => {
    setSelectedDocument(document);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDocument(null);
  };

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered and sorted documents
  let filteredDocuments = documentTemplate.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? String(doc.status) === statusFilter : true;
    const matchesDate = dateFilter ? doc.date_created.startsWith(dateFilter) : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (sortField) {
    filteredDocuments = [...filteredDocuments].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return 0;
    });
  }

  const getStatusIcon = (status: number | string) => {
    switch (status) {
      case 1:
      case "1":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 2:
      case "2":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 3:
      case "3":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: number | string) => {
    switch (status) {
      case 1:
      case "1":
        return 'bg-blue-100 text-blue-800';
      case 2:
      case "2":
        return 'bg-green-100 text-green-400';
      case 3:
      case "3":
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number | string) => {
    switch (status) {
      case 1:
      case "1":
        return "For Approval";
      case 2:
      case "2":
        return "Approved";
      case 3:
      case "3":
        return "Completed";
      case 4:
        return "Unknown";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">View Documents</h1>
            <p className="text-gray-600">Manage and track all your documents in one place.</p>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredDocuments.length} of {documentTemplate.length} documents
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
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
              <option value="1">{getStatusText(1)}</option>
              <option value="2">{getStatusText(2)}</option>
              <option value="3">{getStatusText(3)}</option>
              <option value="4">{getStatusText(4)}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Types</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    Document Name
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "name" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "status" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date_created')}>
                  <div className="flex items-center">
                    Created
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "date_created" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('last_modified')}>
                  <div className="flex items-center">
                    Modified
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "last_modified" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No documents found</p>
                    <p>Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(doc.status)}`}>
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.date_created ? new Date(doc.date_created).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/([A-Za-z]{3}) /, '$1. ') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.last_modified ? new Date(doc.last_modified).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/([A-Za-z]{3}) /, '$1. ') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
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
      <DocumentDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
         document={selectedDocument as any}
        mode={dialogMode}
        getDocuments={getDocuments}
      />
    </div>
  );
}

export default Document;