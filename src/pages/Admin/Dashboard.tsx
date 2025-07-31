import axios from "./../../plugin/axios";
import { useEffect, useState } from "react"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  AlertCircle,
  X,
  Edit,
  Save
} from "lucide-react";
import { generatePDFWithFields, Field } from './Document/pdfGenerator';
import { DocumentPDFViewer } from './Document/DocumentPDFViewer';
import Swal from "sweetalert2";
import { evaluate } from 'mathjs';

interface Document {
  id: number;
  name: string;
  status: number;
  date_created: string;
  last_modified: string;
  created_by: {
    id: number;
    name: string;
    designation: string;
  };
  submitted_by: string;
  department: string;
  tracking_id: string;
  to_route: number;
  document_data: any;
  assignatures: any[];
  remarks: any;
  template: any;
}

// Edit Document Modal Component
const EditDocumentModal = ({ 
  document, 
  isOpen, 
  onClose, 
  onSave, 
  isUpdating 
}: { 
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDoc: Document) => void;
  isUpdating: boolean;
}) => {
  const [formData, setFormData] = useState<Document | null>(null);

  // Formula evaluation function with table context support
  const evaluateFormula = (formula: string, _fields: any[], documentData: Record<string, any>, currentRow?: number, tableFieldId?: string): string => {
    if (!formula?.trim()) return '';
    
    try {
      let processedFormula = formula;
      console.log(`Evaluating formula: "${formula}" for row ${currentRow} in table ${tableFieldId}`);
      
      // Replace field references with their values
      const fieldReferences = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?(_\d+_\d+)?\b/g) || [];
      console.log('Found field references:', fieldReferences);
      
      fieldReferences.forEach(ref => {
        let value = 0;
        let foundValue = false;
        
        // Handle table column references in the same row (e.g., "quantity", "price", "unitcost", "totalcost")
        if (currentRow !== undefined && tableFieldId) {
          // Check if this reference matches a column name in the current table
          const tableFields = document?.template?.body?.fields?.filter((f: any) => f.type === 'table') || [];
          const currentTableField = tableFields.find((f: any) => f.id === tableFieldId);
          
          if (currentTableField?.tableConfig?.columns) {
            // Try different matching strategies for column references
            let columnIndex = -1;
            
            // 1. Exact ID match
            columnIndex = currentTableField.tableConfig.columns.findIndex((col: any) => col.id === ref);
            
            // 2. Exact label match (case insensitive)
            if (columnIndex === -1) {
              columnIndex = currentTableField.tableConfig.columns.findIndex((col: any) => 
                col.label.toLowerCase() === ref.toLowerCase()
              );
            }
            
            // 3. Label without spaces match
            if (columnIndex === -1) {
              columnIndex = currentTableField.tableConfig.columns.findIndex((col: any) => 
                col.label.toLowerCase().replace(/\s+/g, '') === ref.toLowerCase()
              );
            }
            
            // 4. Common field name mappings
            if (columnIndex === -1) {
              const commonMappings: Record<string, string[]> = {
                'quantity': ['qty', 'quantity', 'amount', 'number'],
                'price': ['price', 'unitprice', 'unit_price', 'cost', 'unitcost', 'unit_cost'],
                'total': ['total', 'totalcost', 'total_cost', 'totalprice', 'total_price', 'amount'],
                'subtotal': ['subtotal', 'sub_total', 'sub total'],
              };
              
              for (const [, variants] of Object.entries(commonMappings)) {
                if (variants.includes(ref.toLowerCase())) {
                  columnIndex = currentTableField.tableConfig.columns.findIndex((col: any) => 
                    variants.some(variant => 
                      col.label.toLowerCase().replace(/\s+/g, '') === variant.replace(/\s+/g, '') ||
                      col.id?.toLowerCase() === variant
                    )
                  );
                  if (columnIndex >= 0) break;
                }
              }
            }
            
            if (columnIndex >= 0) {
              const cellKey = `${tableFieldId}_${currentRow}_${columnIndex}`;
              const cellValue = documentData[cellKey];
              value = parseFloat(cellValue) || 0;
              foundValue = true;
              console.log(`Found table cell reference: ${ref} -> ${cellKey} = ${cellValue} (${value})`);
              processedFormula = processedFormula.replace(new RegExp(`\\b${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), value.toString());
              return; // Skip other reference handling for this match
            }
          }
        }
        
        if (!foundValue) {
          // Handle regular field references
          if (documentData[ref] !== undefined) {
            value = parseFloat(documentData[ref]) || 0;
            foundValue = true;
            console.log(`Found regular field: ${ref} = ${value}`);
          }
          // Handle group field references (e.g., group1.field2)
          else if (ref.includes('.')) {
            const [groupId, subFieldId] = ref.split('.');
            const groupData = documentData[groupId] || {};
            value = parseFloat(groupData[subFieldId]) || 0;
            foundValue = true;
            console.log(`Found group field: ${ref} = ${value}`);
          }
          // Handle specific table cell references (e.g., table_0_1)
          else if (ref.includes('_') && /\d+_\d+$/.test(ref)) {
            value = parseFloat(documentData[ref]) || 0;
            foundValue = true;
            console.log(`Found specific table cell: ${ref} = ${value}`);
          }
          // Handle table.column references for other tables
          else if (ref.includes('.') && !ref.includes('_')) {
            const [refTableId, columnName] = ref.split('.');
            const refTableFields = document?.template?.body?.fields?.filter((f: any) => f.type === 'table') || [];
            const refTableField = refTableFields.find((f: any) => f.id === refTableId);
            
            if (refTableField?.tableConfig?.columns) {
              const columnIndex = refTableField.tableConfig.columns.findIndex((col: any) => 
                col.id === columnName || col.label.toLowerCase().replace(/\s+/g, '') === columnName.toLowerCase()
              );
              
              if (columnIndex >= 0 && currentRow !== undefined) {
                const cellKey = `${refTableId}_${currentRow}_${columnIndex}`;
                value = parseFloat(documentData[cellKey]) || 0;
                foundValue = true;
                console.log(`Found other table reference: ${ref} -> ${cellKey} = ${value}`);
              }
            }
          }
          
          if (!foundValue) {
            console.log(`Field reference not found: ${ref}, using 0`);
          }
          
          processedFormula = processedFormula.replace(new RegExp(`\\b${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), value.toString());
        }
      });
      
      console.log(`Processed formula: "${processedFormula}"`);
      
      // Evaluate the mathematical expression
      const result = evaluate(processedFormula);
      const finalResult = typeof result === 'number' ? result.toFixed(2) : result.toString();
      console.log(`Formula result: ${finalResult}`);
      return finalResult;
    } catch (error) {
      console.error('Formula evaluation error:', error, 'Formula:', formula);
      return 'Error';
    }
  };

  useEffect(() => {
    if (document && isOpen) {
      setFormData({ ...document });
    }
  }, [document, isOpen]);

  if (!isOpen || !document || !formData) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  const getStatusOptions = () => [
    { value: 0, label: 'Draft', color: 'text-gray-600' },
    { value: 1, label: 'Pending', color: 'text-yellow-600' },
    { value: 2, label: 'Approved', color: 'text-green-600' },
    { value: 3, label: 'Rejected', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Document</h2>
            <p className="text-gray-600">{document.tracking_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(95vh-120px)]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getStatusOptions().map(option => (
                    <option key={option.value} value={option.value} className={option.color}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Submitted By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submitted By
                </label>
                <input
                  type="text"
                  value={formData.submitted_by}
                  onChange={(e) => handleInputChange('submitted_by', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* To Route */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route To
                </label>
                <input
                  type="number"
                  value={formData.to_route}
                  onChange={(e) => handleInputChange('to_route', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Creator Info (Read-only) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-900 font-medium">{formData.created_by.name}</div>
                  <div className="text-sm text-gray-600">{formData.created_by.designation}</div>
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={typeof formData.remarks === 'string' ? formData.remarks : JSON.stringify(formData.remarks || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('remarks', parsed);
                  } catch {
                    handleInputChange('remarks', e.target.value);
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter remarks or JSON object"
              />
            </div>

            {/* Table Data Editor - Enhanced with Template Support */}
            {(() => {
              // Get table fields from template
              const tableFields = document.template?.body?.fields?.filter((field: any) => field.type === 'table') || [];
              
              if (tableFields.length > 0) {
                return (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Table Data
                    </label>
                    {tableFields.map((tableField: any) => {
                      const tableData = Object.entries(formData.document_data || {})
                        .filter(([key]) => key.startsWith(`${tableField.id}_`))
                        .reduce((acc, [key, value]) => {
                          const match = key.match(new RegExp(`${tableField.id}_(\\d+)_(\\d+)`));
                          if (match) {
                            const row = parseInt(match[1]);
                            const col = parseInt(match[2]);
                            if (!acc[row]) acc[row] = {};
                            acc[row][col] = value;
                          }
                          return acc;
                        }, {} as Record<number, Record<number, any>>);
                      
                      const rows = Object.keys(tableData).map(Number).sort((a, b) => a - b);
                      const columns = tableField.tableConfig?.columns || [];
                      
                      const handleTableCellChange = (row: number, col: number, value: string) => {
                        const cellKey = `${tableField.id}_${row}_${col}`;
                        
                        // Auto-calculate if column has formula
                        let updatedData = {
                          ...formData.document_data,
                          [cellKey]: value
                        };

                        // Recalculate ALL formula columns in this row when any value changes
                        columns.forEach((currentCol: any, currentColIndex: number) => {
                          if (currentCol.formula) {
                            const calculatedKey = `${tableField.id}_${row}_${currentColIndex}`;
                            try {
                              const calculatedValue = evaluateFormula(
                                currentCol.formula, 
                                document.template.body.fields, 
                                updatedData,
                                row, // Pass current row for context
                                tableField.id // Pass table field ID for context
                              );
                              updatedData[calculatedKey] = calculatedValue;
                              console.log(`Calculated ${calculatedKey} = ${calculatedValue} using formula: ${currentCol.formula}`);
                            } catch (error) {
                              console.error(`Formula error for ${calculatedKey}:`, error);
                              updatedData[calculatedKey] = 'Error';
                            }
                          }
                        });
                        
                        setFormData(prev => prev ? {
                          ...prev,
                          document_data: updatedData
                        } : null);
                      };

                      const addNewRow = () => {
                        const newRowIndex = rows.length > 0 ? Math.max(...rows) + 1 : 0;
                        const newRowData: Record<string, string> = {};
                        
                        // Initialize all columns for the new row
                        columns.forEach((_: any, colIndex: number) => {
                          newRowData[`${tableField.id}_${newRowIndex}_${colIndex}`] = '';
                        });
                        
                        const updatedData = {
                          ...formData.document_data,
                          ...newRowData
                        };

                        // Calculate formulas for the new row
                        columns.forEach((column: any, colIndex: number) => {
                          if (column.formula) {
                            const calculatedKey = `${tableField.id}_${newRowIndex}_${colIndex}`;
                            try {
                              const calculatedValue = evaluateFormula(
                                column.formula,
                                document.template.body.fields,
                                updatedData,
                                newRowIndex,
                                tableField.id
                              );
                              updatedData[calculatedKey] = calculatedValue;
                              console.log(`New row formula calculated: ${calculatedKey} = ${calculatedValue}`);
                            } catch (error) {
                              console.error(`Formula error for new row ${calculatedKey}:`, error);
                              updatedData[calculatedKey] = 'Error';
                            }
                          }
                        });
                        
                        setFormData(prev => prev ? {
                          ...prev,
                          document_data: updatedData
                        } : null);
                      };

                      const removeRow = (rowToRemove: number) => {
                        const updatedDocumentData = { ...formData.document_data };
                        columns.forEach((_: any, colIndex: number) => {
                          delete updatedDocumentData[`${tableField.id}_${rowToRemove}_${colIndex}`];
                        });
                        
                        setFormData(prev => prev ? {
                          ...prev,
                          document_data: updatedDocumentData
                        } : null);
                      };
                      
                      return (
                        <div key={tableField.id} className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-md font-medium text-gray-800">{tableField.label}</h4>
                            <button
                              type="button"
                              onClick={addNewRow}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                            >
                              Add Row
                            </button>
                          </div>
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left w-8">#</th>
                                    {columns.map((column: any, index: number) => (
                                      <th key={index} className="px-3 py-2 text-xs font-medium text-gray-700 text-left">
                                        {column.label}
                                        {column.formula && <span className="text-blue-600 ml-1">📊</span>}
                                      </th>
                                    ))}
                                    <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left w-20">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {rows.map(row => (
                                    <tr key={row} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-500">{row + 1}</td>
                                      {columns.map((column: any, col: number) => {
                                        const cellValue = tableData[row]?.[col] || '';
                                        
                                        // Calculate formula value if column has formula
                                        const displayValue = column.formula ? 
                                          evaluateFormula(
                                            column.formula, 
                                            document.template.body.fields, 
                                            formData.document_data || {}, 
                                            row, // Pass current row for context
                                            tableField.id // Pass table field ID for context
                                          ) : 
                                          cellValue;
                                        
                                        return (
                                          <td key={col} className="px-3 py-2">
                                            {column.type === 'select' ? (
                                              <select
                                                value={cellValue}
                                                onChange={(e) => handleTableCellChange(row, col, e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                              >
                                                <option value="">Select...</option>
                                                {column.options?.map((option: string, optIndex: number) => (
                                                  <option key={optIndex} value={option}>{option}</option>
                                                ))}
                                              </select>
                                            ) : column.type === 'date' ? (
                                              <input
                                                type="date"
                                                value={cellValue}
                                                onChange={(e) => handleTableCellChange(row, col, e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            ) : column.type === 'number' ? (
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={displayValue}
                                                onChange={(e) => !column.formula && handleTableCellChange(row, col, e.target.value)}
                                                className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                                                  column.formula ? 'bg-blue-50 border-blue-300 font-medium' : ''
                                                }`}
                                                placeholder={column.formula ? 'Calculated' : 'Enter amount'}
                                                readOnly={!!column.formula}
                                              />
                                            ) : (
                                              <input
                                                type="text"
                                                value={cellValue}
                                                onChange={(e) => handleTableCellChange(row, col, e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={`Enter ${column.label.toLowerCase()}`}
                                              />
                                            )}
                                          </td>
                                        );
                                      })}
                                      <td className="px-3 py-2">
                                        <button
                                          type="button"
                                          onClick={() => removeRow(row)}
                                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                          title="Remove row"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                {/* Totals row for tables with numeric columns */}
                                {(() => {
                                  const numericColumns = columns.filter((col: any) => col.type === 'number');
                                  if (numericColumns.length > 0) {
                                    return (
                                      <tfoot className="bg-gray-100">
                                        <tr>
                                          <td className="px-3 py-2 text-sm font-medium text-gray-900">Total</td>
                                          {columns.map((column: any, colIndex: number) => {
                                            if (column.type === 'number') {
                                              let total = 0;
                                              rows.forEach(row => {
                                                const cellValue = tableData[row]?.[colIndex];
                                                if (cellValue && !isNaN(parseFloat(cellValue))) {
                                                  total += parseFloat(cellValue);
                                                }
                                              });
                                              
                                              return (
                                                <td key={colIndex} className="px-3 py-2 text-sm font-bold text-gray-900">
                                                  {total.toLocaleString('en-US', { 
                                                    minimumFractionDigits: 2, 
                                                    maximumFractionDigits: 2 
                                                  })}
                                                </td>
                                              );
                                            }
                                            return <td key={colIndex} className="px-3 py-2"></td>;
                                          })}
                                          <td className="px-3 py-2"></td>
                                        </tr>
                                      </tfoot>
                                    );
                                  }
                                  return null;
                                })()}
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              // Fallback to original table editor if no template table fields
              const tableData = Object.entries(formData.document_data || {})
                .filter(([key]) => key.startsWith('table_'))
                .reduce((acc, [key, value]) => {
                  const match = key.match(/table_(\d+)_(\d+)/);
                  if (match) {
                    const row = parseInt(match[1]);
                    const col = parseInt(match[2]);
                    if (!acc[row]) acc[row] = {};
                    acc[row][col] = value;
                  }
                  return acc;
                }, {} as Record<number, Record<number, any>>);
              
              const rows = Object.keys(tableData).map(Number).sort((a, b) => a - b);
              
              if (rows.length > 0) {
                const maxCols = Math.max(...rows.map(row => Math.max(...Object.keys(tableData[row]).map(Number))));
                
                const purchaseRequestHeaders = [
                  'Unit',
                  'Item Description', 
                  'Quantity',
                  'Unit Cost',
                  'Total Cost'
                ];

                const handleTableCellChange = (row: number, col: number, value: string) => {
                  const cellKey = `table_${row}_${col}`;
                  
                  // Auto-calculate total cost if quantity or unit cost changes
                  let updatedData = {
                    ...formData.document_data,
                    [cellKey]: value
                  };

                  // If this is quantity (col 2) or unit cost (col 3), calculate total cost (col 4)
                  if (col === 2 || col === 3) {
                    const quantityKey = `table_${row}_2`;
                    const unitCostKey = `table_${row}_3`;
                    const totalCostKey = `table_${row}_4`;
                    
                    const quantity = col === 2 ? parseFloat(value) : parseFloat(updatedData[quantityKey] || '0');
                    const unitCost = col === 3 ? parseFloat(value) : parseFloat(updatedData[unitCostKey] || '0');
                    
                    if (!isNaN(quantity) && !isNaN(unitCost)) {
                      const totalCost = quantity * unitCost;
                      updatedData[totalCostKey] = totalCost.toFixed(2);
                    }
                  }
                  
                  setFormData(prev => prev ? {
                    ...prev,
                    document_data: updatedData
                  } : null);
                };

                const addNewRow = () => {
                  const newRowIndex = rows.length > 0 ? Math.max(...rows) + 1 : 0;
                  const newRowData: Record<string, string> = {};
                  for (let col = 0; col <= maxCols; col++) {
                    newRowData[`table_${newRowIndex}_${col}`] = '';
                  }
                  
                  setFormData(prev => prev ? {
                    ...prev,
                    document_data: {
                      ...prev.document_data,
                      ...newRowData
                    }
                  } : null);
                };

                const removeRow = (rowToRemove: number) => {
                  const updatedDocumentData = { ...formData.document_data };
                  for (let col = 0; col <= maxCols; col++) {
                    delete updatedDocumentData[`table_${rowToRemove}_${col}`];
                  }
                  
                  setFormData(prev => prev ? {
                    ...prev,
                    document_data: updatedDocumentData
                  } : null);
                };
                
                return (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Table Data (Legacy Format)
                      </label>
                      <button
                        type="button"
                        onClick={addNewRow}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                      >
                        Add Row
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left w-8">#</th>
                              {Array.from({ length: maxCols + 1 }, (_, i) => (
                                <th key={i} className="px-3 py-2 text-xs font-medium text-gray-700 text-left">
                                  {purchaseRequestHeaders[i] || `Column ${i + 1}`}
                                </th>
                              ))}
                              <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {rows.map(row => (
                              <tr key={row} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-500">{row + 1}</td>
                                {Array.from({ length: maxCols + 1 }, (_, col) => (
                                  <td key={col} className="px-3 py-2">
                                    <input
                                      type={col === 2 || col === 3 || col === 4 ? "number" : "text"}
                                      step={col === 3 || col === 4 ? "0.01" : "1"}
                                      min={col === 2 || col === 3 || col === 4 ? "0" : undefined}
                                      value={tableData[row][col] || ''}
                                      onChange={(e) => handleTableCellChange(row, col, e.target.value)}
                                      className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                                        col === 4 ? 'bg-gray-50 font-medium' : ''
                                      }`}
                                      placeholder={`Enter ${purchaseRequestHeaders[col] || 'value'}`}
                                      readOnly={col === 4} // Make total cost read-only as it's auto-calculated
                                    />
                                  </td>
                                ))}
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => removeRow(row)}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Remove row"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Totals row */}
                          {(() => {
                            let totalAmount = 0;
                            
                            rows.forEach(row => {
                              const totalCostValue = tableData[row][maxCols];
                              if (totalCostValue && !isNaN(parseFloat(totalCostValue))) {
                                totalAmount += parseFloat(totalCostValue);
                              }
                            });
                            
                            if (totalAmount > 0) {
                              return (
                                <tfoot className="bg-gray-100">
                                  <tr>
                                    <td className="px-3 py-2"></td>
                                    <td colSpan={maxCols} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                                      Total Amount:
                                    </td>
                                    <td className="px-3 py-2 text-sm font-bold text-gray-900">
                                      {totalAmount.toLocaleString('en-US', { 
                                        minimumFractionDigits: 2, 
                                        maximumFractionDigits: 2 
                                      })}
                                    </td>
                                    <td className="px-3 py-2"></td>
                                  </tr>
                                </tfoot>
                              );
                            }
                            return null;
                          })()}
                        </table>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // No table data exists, provide option to create one
                const createFirstTable = () => {
                  const newRowData: Record<string, string> = {};
                  for (let col = 0; col <= 4; col++) { // Create 5 columns by default
                    newRowData[`table_0_${col}`] = '';
                  }
                  
                  setFormData(prev => prev ? {
                    ...prev,
                    document_data: {
                      ...prev.document_data,
                      ...newRowData
                    }
                  } : null);
                };
                
                return (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table Data
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500 mb-4">No table data found in this document.</p>
                      <button
                        type="button"
                        onClick={createFirstTable}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Table
                      </button>
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Template-based Document Data Fields */}
            {document.template?.body?.fields && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Document Fields
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {document.template.body.fields
                    .filter((field: any) => field.type !== 'table') // We handle tables separately
                    .map((field: any) => {
                      const fieldValue = formData.document_data?.[field.id] || '';
                      
                      return (
                        <div key={field.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {/* Text Field */}
                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => setFormData(prev => prev ? {
                                ...prev,
                                document_data: {
                                  ...prev.document_data,
                                  [field.id]: e.target.value
                                }
                              } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={field.required}
                            />
                          )}

                          {/* Number Field */}
                          {field.type === 'number' && (
                            <div>
                              <input
                                type="number"
                                step="0.01"
                                value={field.formula ? 
                                  evaluateFormula(field.formula, document.template.body.fields, formData.document_data || {}) : 
                                  fieldValue
                                }
                                onChange={(e) => !field.formula && setFormData(prev => prev ? {
                                  ...prev,
                                  document_data: {
                                    ...prev.document_data,
                                    [field.id]: e.target.value
                                  }
                                } : null)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  field.formula ? 'bg-blue-50 border-blue-300' : ''
                                }`}
                                required={field.required}
                                readOnly={!!field.formula}
                              />
                              {field.formula && (
                                <div className="text-xs text-blue-600 mt-1">
                                  📊 Formula: {field.formula}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Select Field */}
                          {field.type === 'select' && (
                            <select
                              value={fieldValue}
                              onChange={(e) => setFormData(prev => prev ? {
                                ...prev,
                                document_data: {
                                  ...prev.document_data,
                                  [field.id]: e.target.value
                                }
                              } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={field.required}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((option: string, index: number) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                          )}

                          {/* Checkbox Field */}
                          {field.type === 'checkbox' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={fieldValue === true || fieldValue === 'true'}
                                onChange={(e) => setFormData(prev => prev ? {
                                  ...prev,
                                  document_data: {
                                    ...prev.document_data,
                                    [field.id]: e.target.checked
                                  }
                                } : null)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-600">Yes/No</span>
                            </div>
                          )}

                          {/* Date Field */}
                          {field.type === 'date' && (
                            <input
                              type="date"
                              value={fieldValue}
                              onChange={(e) => setFormData(prev => prev ? {
                                ...prev,
                                document_data: {
                                  ...prev.document_data,
                                  [field.id]: e.target.value
                                }
                              } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={field.required}
                            />
                          )}

                          {/* Email Field */}
                          {field.type === 'email' && (
                            <input
                              type="email"
                              value={fieldValue}
                              onChange={(e) => setFormData(prev => prev ? {
                                ...prev,
                                document_data: {
                                  ...prev.document_data,
                                  [field.id]: e.target.value
                                }
                              } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={field.required}
                            />
                          )}

                          {/* Textarea Field */}
                          {field.type === 'textarea' && (
                            <textarea
                              value={fieldValue}
                              onChange={(e) => setFormData(prev => prev ? {
                                ...prev,
                                document_data: {
                                  ...prev.document_data,
                                  [field.id]: e.target.value
                                }
                              } : null)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={field.required}
                            />
                          )}

                          {/* Group Field */}
                          {field.type === 'group' && field.groupConfig?.fields && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">{field.label}</h4>
                              <div className="space-y-3">
                                {field.groupConfig.fields.map((subField: any) => {
                                  const groupData = formData.document_data?.[field.id] || {};
                                  const subFieldValue = groupData[subField.id] || '';
                                  
                                  return (
                                    <div key={subField.id}>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        {subField.label}
                                        {subField.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      
                                      {subField.type === 'text' && (
                                        <input
                                          type="text"
                                          value={subFieldValue}
                                          onChange={(e) => setFormData(prev => prev ? {
                                            ...prev,
                                            document_data: {
                                              ...prev.document_data,
                                              [field.id]: {
                                                ...groupData,
                                                [subField.id]: e.target.value
                                              }
                                            }
                                          } : null)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                          required={subField.required}
                                        />
                                      )}
                                      
                                      {subField.type === 'number' && (
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={subField.formula ? 
                                            evaluateFormula(subField.formula, document.template.body.fields, formData.document_data || {}) : 
                                            subFieldValue
                                          }
                                          onChange={(e) => !subField.formula && setFormData(prev => prev ? {
                                            ...prev,
                                            document_data: {
                                              ...prev.document_data,
                                              [field.id]: {
                                                ...groupData,
                                                [subField.id]: e.target.value
                                              }
                                            }
                                          } : null)}
                                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                                            subField.formula ? 'bg-blue-50 border-blue-300' : ''
                                          }`}
                                          required={subField.required}
                                          readOnly={!!subField.formula}
                                        />
                                      )}
                                      
                                      {subField.type === 'select' && (
                                        <select
                                          value={subFieldValue}
                                          onChange={(e) => setFormData(prev => prev ? {
                                            ...prev,
                                            document_data: {
                                              ...prev.document_data,
                                              [field.id]: {
                                                ...groupData,
                                                [subField.id]: e.target.value
                                              }
                                            }
                                          } : null)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                          required={subField.required}
                                        >
                                          <option value="">Select...</option>
                                          {subField.options?.map((option: string, index: number) => (
                                            <option key={index} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Additional Document Data (fields not in template) */}
            {(() => {
              if (!document.template?.body?.fields) return null;
              
              const templateFieldIds = new Set(document.template.body.fields.map((field: any) => field.id));
              const additionalFields = Object.entries(formData.document_data || {})
                .filter(([key]) => !key.startsWith('table_') && !templateFieldIds.has(key))
                .filter(([key, value]) => key && value !== null && value !== undefined && value !== '');
              
              if (additionalFields.length === 0) return null;
              
              return (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Data (Not in Template)
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-800 mb-3">
                      These fields exist in the document data but are not defined in the template structure:
                    </div>
                    <div className="space-y-3">
                      {additionalFields.map(([key, value]) => {
                        // Handle nested objects
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="bg-white rounded-lg p-3">
                              <div className="font-medium text-gray-800 capitalize mb-2">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </div>
                              <div className="space-y-2">
                                {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                                  <div key={subKey} className="grid grid-cols-3 gap-2 items-center">
                                    <label className="text-sm text-gray-600 capitalize">
                                      {subKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                                    </label>
                                    <div className="col-span-2">
                                      <input
                                        type="text"
                                        value={String(subValue)}
                                        onChange={(e) => {
                                          setFormData(prev => prev ? {
                                            ...prev,
                                            document_data: {
                                              ...prev.document_data,
                                              [key]: {
                                                ...(prev.document_data[key] as Record<string, any>),
                                                [subKey]: e.target.value
                                              }
                                            }
                                          } : null);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // Handle boolean values
                        if (typeof value === 'boolean') {
                          return (
                            <div key={key} className="bg-white rounded p-3 grid grid-cols-3 gap-2 items-center">
                              <label className="text-sm font-medium text-gray-600 capitalize">
                                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                              </label>
                              <div className="col-span-2">
                                <select
                                  value={value ? 'true' : 'false'}
                                  onChange={(e) => {
                                    setFormData(prev => prev ? {
                                      ...prev,
                                      document_data: {
                                        ...prev.document_data,
                                        [key]: e.target.value === 'true'
                                      }
                                    } : null);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              </div>
                            </div>
                          );
                        }
                        
                        // Handle regular values
                        return (
                          <div key={key} className="bg-white rounded p-3 grid grid-cols-3 gap-2 items-center">
                            <label className="text-sm font-medium text-gray-600 capitalize">
                              {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                            </label>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={String(value)}
                                onChange={(e) => {
                                  setFormData(prev => prev ? {
                                    ...prev,
                                    document_data: {
                                      ...prev.document_data,
                                      [key]: e.target.value
                                    }
                                  } : null);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Document Viewer Modal Component
const DocumentViewerModal = ({ document, isOpen, onClose }: { document: Document | null, isOpen: boolean, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  
  if (!isOpen || !document) return null;

  const downloadPDF = async () => {
    if (!document.template) {
      alert('No template available for this document. Cannot generate PDF.');
      return;
    }

    setLoading(true);
    try {
      const pdfUrl = document.template.file;
      const templateFields = document.template.body.fields as Field[];
      const values = document.document_data;

      console.log('Generating PDF with:', { pdfUrl, fields: templateFields, values });

      const pdfDoc = await generatePDFWithFields(pdfUrl, templateFields, values);
      const pdfBytes = await pdfDoc.save();

      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.name}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{document.name}</h2>
            <p className="text-gray-600">{document.tracking_id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadPDF}
              disabled={loading || !document.template}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!document.template ? 'No template available for download' : 'Download PDF'}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* Left Sidebar - Document Info */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Information</h3>
                <div className="space-y-2">
                 

                  <div className=" flex flex-col gap-5">
  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Created by:</span>
                    <div className="text-right">
                      <div className="text-gray-900">{document.created_by.name}</div>
                      <div className="text-sm text-gray-500">{document.created_by.designation}</div>
                    </div>
                  </div>
                    <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="text-gray-900">{document.department}</span>
                  </div>


                   <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      document.status === 0 ? 'bg-gray-100 text-gray-800' :
                      document.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                      document.status === 2 ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {document.status === 0 ? 'Draft' :
                       document.status === 1 ? 'Pending' :
                       document.status === 2 ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  
                
                
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Modified:</span>
                    <span className="text-gray-900">{new Date(document.last_modified).toLocaleDateString()}</span>
                  </div>

                  </div>
                  
                </div>
              </div>

              {/* Signatures */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="space-y-3">
                  {document.assignatures.map((signature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{signature.name}</p>
                        <p className="text-sm text-gray-600">
                          {signature.status ? 'Signed' : 'Pending'}
                          {signature.signed_date && ` on ${new Date(signature.signed_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${signature.status ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    </div>
                  ))}
                  {document.assignatures.length === 0 && (
                    <p className="text-gray-500 text-sm">No signatures required</p>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {document.remarks && Object.keys(document.remarks).length > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-gray-900 whitespace-pre-wrap text-sm">
                      {JSON.stringify(document.remarks, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - PDF Viewer */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              
              
              {document.template ? (
                <>
                  
                  <DocumentPDFViewer
                    pdfUrl={document.template.file}
                    fields={document.template.body.fields as Field[]}
                    documentData={document.document_data || {}}
                  />
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Template Available</h3>
                  <p className="text-yellow-700 mb-4">This document doesn't have an associated template, but here's the submitted data:</p>
                  
                  <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto">
                    <h4 className="font-semibold mb-3">Document Data:</h4>
                    {Object.entries(document.document_data).map(([key, value]) => {
                      // Handle nested objects like requestor and approver
                      if (typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="mb-3">
                            <div className="font-medium text-gray-800 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
                            <div className="ml-4 space-y-1">
                              {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                                <div key={subKey} className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-sm text-gray-600 capitalize">
                                    {subKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-sm text-gray-900">{String(subValue)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle table data separately
                      if (key.startsWith('table_')) {
                        return null; // We'll handle these below
                      }
                      
                      // Handle boolean values
                      if (typeof value === 'boolean') {
                        return (
                          <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                            <span className="font-medium text-gray-600 capitalize">
                              {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {value ? 'Yes' : 'No'}
                              </span>
                            </span>
                          </div>
                        );
                      }
                      
                      // Handle regular values
                      return (
                        <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                          <span className="font-medium text-gray-600 capitalize">
                            {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-900">{String(value)}</span>
                        </div>
                      );
                    })}
                    
                    {/* Handle table data */}
                    {(() => {
                      const tableData = Object.entries(document.document_data)
                        .filter(([key]) => key.startsWith('table_'))
                        .reduce((acc, [key, value]) => {
                          const match = key.match(/table_(\d+)_(\d+)/);
                          if (match) {
                            const row = parseInt(match[1]);
                            const col = parseInt(match[2]);
                            if (!acc[row]) acc[row] = {};
                            acc[row][col] = value;
                          }
                          return acc;
                        }, {} as Record<number, Record<number, any>>);
                      
                      const rows = Object.keys(tableData).map(Number).sort((a, b) => a - b);
                      
                      if (rows.length > 0) {
                        const maxCols = Math.max(...rows.map(row => Math.max(...Object.keys(tableData[row]).map(Number))));
                        
                        // Purchase Request table headers based on common structure
                        const purchaseRequestHeaders = [
                          'Unit',
                          'Item Description', 
                          'Quantity',
                          'Unit Cost',
                          'Total Cost'
                        ];
                        
                        return (
                          <div className="mt-4">
                            <h5 className="font-semibold mb-2">Table Data:</h5>
                            <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-300">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {Array.from({ length: maxCols + 1 }, (_, i) => (
                                      <th key={i} className="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700">
                                        {purchaseRequestHeaders[i] || `Column ${i + 1}`}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map(row => (
                                    <tr key={row} className={row % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      {Array.from({ length: maxCols + 1 }, (_, col) => (
                                        <td key={col} className="px-3 py-2 border border-gray-300 text-sm text-gray-900">
                                          {tableData[row][col] || '-'}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                                {/* Add totals row if applicable */}
                                {(() => {
                                  // Check if we have numeric data in cost columns (usually last 2 columns)
                                  const costCols = [maxCols - 1, maxCols]; // Unit Cost and Total Cost columns
                                  let hasCostData = false;
                                  let totalAmount = 0;
                                  
                                  rows.forEach(row => {
                                    costCols.forEach(col => {
                                      const value = tableData[row][col];
                                      if (value && !isNaN(parseFloat(value))) {
                                        hasCostData = true;
                                        if (col === maxCols) { // Total Cost column
                                          totalAmount += parseFloat(value);
                                        }
                                      }
                                    });
                                  });
                                  
                                  if (hasCostData && totalAmount > 0) {
                                    return (
                                      <tfoot className="bg-gray-100">
                                        <tr>
                                          <td colSpan={maxCols} className="px-3 py-2 border border-gray-300 text-sm font-medium text-gray-900 text-right">
                                            Total Amount:
                                          </td>
                                          <td className="px-3 py-2 border border-gray-300 text-sm font-bold text-gray-900">
                                            {totalAmount.toLocaleString('en-US', { 
                                              minimumFractionDigits: 2, 
                                              maximumFractionDigits: 2 
                                            })}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    );
                                  }
                                  return null;
                                })()}
                              </table>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [editDocument, setEditDocument] = useState<Document | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Status mapping
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock };
      case 1:
        return { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case 2:
        return { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case 3:
        return { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };



  const updateDocument = async (updatedDoc?: Document) => {
    const docToUpdate = updatedDoc || editDocument;
    if (!docToUpdate) return;
    
    setIsUpdating(true);
    try {
      // Ensure created_by is sent as just the ID number
      const documentToSend = {
        ...docToUpdate,
        created_by: docToUpdate.created_by.id
      };
      
      await axios.put(`document/${docToUpdate.id}/`, documentToSend);
      
      // Update the local documents state
      setDocuments(prev => prev.map(doc => 
        doc.id === docToUpdate.id ? docToUpdate : doc
      ));
      
      setShowEditModal(false);
      setEditDocument(null);
      
      Swal.fire({
        icon: 'success',
        title: 'Document Updated',
        text: 'The document has been successfully updated.',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error("There was an error updating the document!", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'There was an error updating the document. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditDocument = (doc: Document) => {
    setEditDocument({ ...doc });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditDocument(null);
  };

  const handleQuickStatusUpdate = async (doc: Document, newStatus: number) => {
    try {
      const updatedDoc = { ...doc, status: newStatus };
      await axios.put(`document/${doc.id}/`, updatedDoc);
      
      // Update the local documents state
      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? updatedDoc : d
      ));
      
      const statusText = newStatus === 0 ? 'Draft' : 
                        newStatus === 1 ? 'Pending' : 
                        newStatus === 2 ? 'Approved' : 'Rejected';
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Document status has been changed to ${statusText}.`,
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error("Error updating document status:", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'There was an error updating the document status.',
      });
    }
  };

  const handleSelectDocument = (docId: number, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: number) => {
    if (selectedDocuments.length === 0) return;

    try {
      const updatePromises = selectedDocuments.map(docId =>
        axios.put(`document/${docId}/`, { 
          ...documents.find(d => d.id === docId), 
          status: newStatus 
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setDocuments(prev => prev.map(doc => 
        selectedDocuments.includes(doc.id) ? { ...doc, status: newStatus } : doc
      ));

      setSelectedDocuments([]);
      setShowBulkActions(false);

      const statusText = newStatus === 0 ? 'Draft' : 
                        newStatus === 1 ? 'Pending' : 
                        newStatus === 2 ? 'Approved' : 'Rejected';

      Swal.fire({
        icon: 'success',
        title: 'Bulk Update Successful',
        text: `${selectedDocuments.length} document(s) status changed to ${statusText}.`,
        timer: 3000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error in bulk status update:", error);
      Swal.fire({
        icon: 'error',
        title: 'Bulk Update Failed',
        text: 'There was an error updating the selected documents.',
      });
    }
  };

  // Show/hide bulk actions based on selection
  useEffect(() => {
    setShowBulkActions(selectedDocuments.length > 0);
  }, [selectedDocuments]);
  function getDocuments() {
    setLoading(true);
    axios.get('document/all').then((response) => {
      console.log(response.data);
      setDocuments(response.data);
    }).catch((error) => {
      console.error("There was an error fetching the documents!", error);
    }).finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    getDocuments();
  }, []);

  // Filter documents based on search and status
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.created_by.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.created_by.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.status.toString() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: documents.length,
    pending: documents.filter(doc => doc.status === 1).length,
    approved: documents.filter(doc => doc.status === 2).length,
    rejected: documents.filter(doc => doc.status === 3).length,
    draft: documents.filter(doc => doc.status === 0).length,
  };

  // Get recent documents (last 7 days)
  const recentDocuments = documents
    .filter(doc => {
      const docDate = new Date(doc.date_created);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return docDate >= weekAgo;
    })
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
    .slice(0, 5);

  // Department distribution
  const departmentStats = documents.reduce((acc, doc) => {
    acc[doc.department] = (acc[doc.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.template) {
      alert('No template available for this document. Cannot generate PDF.');
      return;
    }

    setDownloadingId(doc.id);
    try {
      const pdfUrl = doc.template.file;
      const templateFields = doc.template.body.fields as Field[];
      const values = doc.document_data;

      console.log('Generating PDF with:', { pdfUrl, fields: templateFields, values });

      const pdfDoc = await generatePDFWithFields(pdfUrl, templateFields, values);
      const pdfBytes = await pdfDoc.save();

      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.name}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Dashboard</h1>
        <p className="text-gray-600">Overview of all document submissions and their current status</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
                <button
                  onClick={getDocuments}
                  className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="0">Draft</option>
                    <option value="1">Pending</option>
                    <option value="2">Approved</option>
                    <option value="3">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {showBulkActions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedDocuments.length} document(s) selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700 mr-3">Bulk Actions:</span>
                    <button
                      onClick={() => handleBulkStatusUpdate(1)}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate(2)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate(3)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDocuments([]);
                        setShowBulkActions(false);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3">
                      <input
                        type="checkbox"
                        checked={filteredDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.slice(0, 10).map((doc) => {
                    const statusInfo = getStatusInfo(doc.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(doc.id)}
                            onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                              <div className="text-sm text-gray-500">{doc.tracking_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative group">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusInfo.color}`}
                              title="Click to change status"
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </span>
                            
                            {/* Quick Status Update Dropdown */}
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="py-1">
                                {[
                                  { value: 0, label: 'Draft', color: 'text-gray-600' },
                                  { value: 1, label: 'Pending', color: 'text-yellow-600' },
                                  { value: 2, label: 'Approved', color: 'text-green-600' },
                                  { value: 3, label: 'Rejected', color: 'text-red-600' }
                                ].map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => handleQuickStatusUpdate(doc, status.value)}
                                    disabled={doc.status === status.value}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${status.color}`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{doc.document_data.office}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">{doc.created_by.name}</span>
                              <span className="text-xs text-gray-500">{doc.created_by.designation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{formatDate(doc.date_created)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDocument(doc)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditDocument(doc)}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Edit Document"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownloadDocument(doc)}
                              disabled={downloadingId === doc.id || !doc.template}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={!doc.template ? 'No template available' : 'Download PDF'}
                            >
                              {downloadingId === doc.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Department Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
            <div className="space-y-3">
              {Object.entries(departmentStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{dept}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                New Document
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      Created by {doc.created_by.name} • {formatDate(doc.date_created)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal 
        document={selectedDocument}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedDocument(null);
        }}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal
        document={editDocument}
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        onSave={(updatedDoc) => updateDocument(updatedDoc)}
        isUpdating={isUpdating}
      />
    </div>
  );
}

export default Dashboard;