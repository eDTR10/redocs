import { Filter, Search, ArrowUpDown, Eye, Download, FileText, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import DocumentDialog from "./dialog/DocumentDialog";

type MyDocument = {
  id: string;
  name: string;
  type: string;
  status: string;
  dateCreated: string;
  lastModified: string;
  size: string;
  description: string;
  createdBy: string;
  version: string;
};

const documents: MyDocument[] = [
  {
    id: '1',
    name: 'Project Guidelines 2024',
    type: 'PDF',
    status: 'Approved',
    dateCreated: '2024-07-15',
    lastModified: '2024-07-16',
    size: '2.4 MB',
    description: 'Comprehensive guidelines for project management and implementation in 2024.',
    createdBy: 'John Doe',
    version: '1.2'
  },
  {
    id: '2',
    name: 'User Manual v3.2',
    type: 'DOCX',
    status: 'In-Route',
    dateCreated: '2024-07-14',
    lastModified: '2024-07-14',
    size: '1.8 MB',
    description: 'Updated user manual with new features and troubleshooting guide.',
    createdBy: 'Jane Smith',
    version: '3.2'
  },
  {
    id: '3',
    name: 'Training Materials',
    type: 'PDF',
    status: 'Pending',
    dateCreated: '2024-07-12',
    lastModified: '2024-07-13',
    size: '3.1 MB',
    description: 'Training materials for new employee orientation program.',
    createdBy: 'Mike Johnson',
    version: '1.0'
  },
  {
    id: '4',
    name: 'Policy Updates',
    type: 'PDF',
    status: 'Approved',
    dateCreated: '2024-07-10',
    lastModified: '2024-07-11',
    size: '890 KB',
    description: 'Updated company policies and procedures for Q3 2024.',
    createdBy: 'Sarah Wilson',
    version: '2.1'
  },
  {
    id: '5',
    name: 'Meeting Notes Q2',
    type: 'DOCX',
    status: 'Declined',
    dateCreated: '2024-07-08',
    lastModified: '2024-07-09',
    size: '654 KB',
    description: 'Quarterly meeting notes and action items for Q2 review.',
    createdBy: 'Tom Brown',
    version: '1.0'
  },
  {
    id: '6',
    name: 'Budget Report Q2',
    type: 'XLSX',
    status: 'Pending',
    dateCreated: '2024-07-07',
    lastModified: '2024-07-08',
    size: '2.1 MB',
    description: 'Detailed budget analysis and financial report for Q2.',
    createdBy: 'Emily Davis',
    version: '1.1'
  },
  {
    id: '7',
    name: 'Safety Guidelines',
    type: 'PDF',
    status: 'In-Route',
    dateCreated: '2024-07-05',
    lastModified: '2024-07-06',
    size: '1.5 MB',
    description: 'Workplace safety guidelines and emergency procedures.',
    createdBy: 'Chris Lee',
    version: '2.0'
  },
  {
    id: '8',
    name: 'Annual Report 2023',
    type: 'PDF',
    status: 'Approved',
    dateCreated: '2024-07-01',
    lastModified: '2024-07-02',
    size: '4.2 MB',
    description: 'Annual company performance report and achievements for 2023.',
    createdBy: 'Alex Chen',
    version: '1.0'
  }
];

type SortField = keyof MyDocument | "";
type SortDirection = "asc" | "desc";

function Document() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view')
  const [selectedDocument, setSelectedDocument] = useState<MyDocument | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFilter('');
  };

  const handleViewDocument = (document: MyDocument) => {
          setSelectedDocument(document);
          setDialogMode('view');
          setIsDialogOpen(true);
      };

       const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedDocument(null);
    };

     const handleSaveDocument = (updatedDocument: any) => {
        // Here you would typically update the document in your backend
        console.log('Saving document:', updatedDocument);
        // For now, we'll just close the dialog
        handleCloseDialog();
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

  const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'In-Route': return <Truck className="w-4 h-4 text-blue-600" />;
            case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'Declined': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <FileText className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'In-Route': return 'bg-blue-100 text-blue-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

  // Filtered and sorted documents
  let filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? doc.status === statusFilter : true;
    const matchesType = typeFilter ? doc.type === typeFilter : true;
    const matchesDate = dateFilter ? doc.dateCreated.startsWith(dateFilter) : true;
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  if (sortField) {
    filteredDocuments = [...filteredDocuments].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];
      // For size, remove "MB"/"KB" and compare as numbers
      if (sortField === "size") {
        const parseSize = (size: string) => {
          if (size.toLowerCase().includes("mb")) return parseFloat(size) * 1024;
          if (size.toLowerCase().includes("kb")) return parseFloat(size);
          return 0;
        };
        aValue = parseSize(a.size);
        bValue = parseSize(b.size);
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      return 0;
    });
  }

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
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>
      </div>

      {/* Search and Filters - separate bg-white card */}
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
              <option value="Pending">Pending</option>
              <option value="In-Route">In-Route</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
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

      {/* Documents Table - separate bg-white card */}
       <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Document Name
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "name" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Type
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "type" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "status" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center">
                    Size
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "size" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dateCreated')}
                >
                  <div className="flex items-center">
                    Created
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "dateCreated" && (
                      <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastModified')}
                >
                  <div className="flex items-center">
                    Modified
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                    {sortField === "lastModified" && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            {getStatusIcon(doc.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(doc.status)}`}>
                                {doc.status}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.dateCreated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.lastModified}</td>
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
                document={selectedDocument}
                mode={dialogMode}
                onSave={handleSaveDocument}
            />
    </div>
     );
}

export default Document;