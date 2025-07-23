import React from 'react';
import { Trash2, Edit, Plus, Upload, X, File, Pen } from 'lucide-react';

// Add to your Field interface
export interface Field {
  // ...existing properties...
  style?: {
    fontSize: string;
    color: string;
    fontFamily: string;    // New
    fontWeight: string;    // New
    fontStyle: string;     // New
  };
}

interface FieldManagerProps {
  fields: Field[];
  setFields: (fields: Field[]) => void;
  showPreviewMode: boolean;
  previewValues: Record<string, any>;
  setPreviewValues: (values: Record<string, any>) => void;
  currentField: Field;
  setCurrentField: (field: Field) => void;
  showFieldModal: boolean;
  setShowFieldModal: (show: boolean) => void;
  editingField: Field | null;
  setEditingField: (field: Field | null) => void;
}

export const FieldManager: React.FC<FieldManagerProps> = ({
  fields,
  setFields,
  showPreviewMode,
  previewValues,
  setPreviewValues,
  currentField,
  setCurrentField,
  showFieldModal,
  setShowFieldModal,
  editingField,
  setEditingField
}) => {
  const getFieldColor = (fieldType: Field['type']) => {
    const colors = {
      text: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
      number: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
      email: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' },
      date: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)' },
      select: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)' },
      checkbox: { stroke: '#84cc16', fill: 'rgba(132, 204, 22, 0.1)' },
      textarea: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.1)' },
      image: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)' },
      list: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.1)' },
      table: { stroke: '#9333ea', fill: 'rgba(147, 51, 234, 0.1)' }
    };
    return colors[fieldType];
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const editField = (field: Field) => {
    setEditingField(field);
    setCurrentField(field);
    setShowFieldModal(true);
  };

  const addField = () => {
    if (editingField) {
      setFields(fields.map(f => f.id === editingField.id ? currentField : f));
      setEditingField(null);
    } else {
      setFields([...fields, { ...currentField }]);
    }
    setShowFieldModal(false);
    setCurrentField({
      id: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      coordinates: null,
      page: 1,
      listConfig: {
        minItems: 1,
        maxItems: 10,
        columns: []
      },
      tableConfig: {
        rows: 1,
        columns: [],
        data: []
      },
      style: {
        fontSize: '12',
        color: '#000000',
        fontFamily: 'Palatino, "Palatino Linotype", serif',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    });
  };

  const addOption = () => {
    setCurrentField({
      ...currentField,
      options: [...currentField.options, '']
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentField.options];
    newOptions[index] = value;
    setCurrentField({
      ...currentField,
      options: newOptions
    });
  };

  const removeOption = (index: number) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.filter((_, i) => i !== index)
    });
  };

  const renderFieldPreview = (field: Field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            className="w-full p-2 border rounded"
            placeholder="user@example.com"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'select':
        return (
          <select
            className="w-full p-2 border rounded"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          >
            <option value="">Select...</option>
            {field.options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={previewValues[field.id] || false}
              onChange={(e) => setPreviewValues({
                ...previewValues,
                [field.id]: e.target.checked
              })}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">Yes/No</span>
          </div>
        );
      case 'textarea':
        return (
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {Array(field.tableConfig.rows).fill(0).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {field.tableConfig.columns.map((col, colIndex) => (
                      <td key={colIndex} className="p-2 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-center"
                          value={previewValues[`${field.id}_${rowIndex}_${colIndex}`] || ''}
                          onChange={(e) => setPreviewValues({
                            ...previewValues,
                            [`${field.id}_${rowIndex}_${colIndex}`]: e.target.value
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                const newField = {...field};
                newField.tableConfig.rows += 1;
                setFields(fields.map(f => f.id === field.id ? newField : f));
              }}
            >
              <Plus size={16} className="inline mr-1" />
              Add Row
            </button>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: event.target?.result
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id={`image-upload-${field.id}`}
            />
            <div className="border rounded p-4 text-center">
              {previewValues[field.id] ? (
                <div className="relative group">
                  <img
                    src={previewValues[field.id]}
                    alt="Preview"
                    className="max-h-32 mx-auto"
                  />
                  <button
                    onClick={() => setPreviewValues({
                      ...previewValues,
                      [field.id]: null
                    })}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`image-upload-${field.id}`}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center"
                >
                  <Upload size={24} />
                  <span className="text-sm mt-1">Upload Image</span>
                </label>
              )}
            </div>
          </div>
        );
      case 'signature':
        return (
          <div className="border rounded p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Signature Details</h4>
              <button 
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                onClick={() => {
                  // Handle signature capture
                  const canvas = document.createElement('canvas');
                  canvas.width = 300;
                  canvas.height = 150;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#f9fafb';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#4b5563';
                    ctx.lineWidth = 2;
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#4b5563';
                    ctx.textAlign = 'center';
                    ctx.fillText('Click to sign here', canvas.width/2, canvas.height/2);
                  }
                  
                  const newSignature = {
                    ...(previewValues[field.id] || {}),
                    img: canvas.toDataURL()
                  };
                  
                  setPreviewValues({
                    ...previewValues,
                    [field.id]: newSignature
                  });
                }}
              >
                <Pen size={14} />
                <span>Sign</span>
              </button>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Full Name</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.name || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        name: e.target.value
                      }
                    });
                  }}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">ID / Position</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.id || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        id: e.target.value
                      }
                    });
                  }}
                  placeholder="Enter your ID or position"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.status || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        status: e.target.value
                      }
                    });
                  }}
                >
                  <option value="">Select status...</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                  <option value="For Review">For Review</option>
                </select>
              </div>
              
              {previewValues[field.id]?.img && (
                <div className="relative">
                  <img 
                    src={previewValues[field.id].img} 
                    alt="Signature" 
                    className="border rounded w-full max-h-24 object-contain bg-white"
                  />
                  <button
                    onClick={() => {
                      const newValue = {...previewValues[field.id]};
                      delete newValue.img;
                      setPreviewValues({
                        ...previewValues,
                        [field.id]: newValue
                      });
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return <div className="text-sm text-gray-500">Preview not available</div>;
    }
  };

  return (
    <>
      {/* Fields List */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Form Fields ({fields.length})</h3>
        {fields.map(field => (
          <div key={field.id} className="mb-4 hover:bg-slate-400/10 p-3 rounded-sm cursor-pointer last:mb-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-sm border-2"
                  style={{ 
                    borderColor: getFieldColor(field.type).stroke,
                    backgroundColor: getFieldColor(field.type).fill
                  }}
                />
                <span className="font-medium text-sm">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              {!showPreviewMode && (
                <div className="flex gap-2">
                  <button
                    onClick={() => editField(field)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            {showPreviewMode ? (
              <div className="mt-1">
                {renderFieldPreview(field)}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                {field.type}
                {field.type === 'table' && ` (${field.tableConfig.columns.length} columns)`}
              </div>
            )}
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No fields added yet. Click "Add Field" to start.
          </div>
        )}
      </div>

      {/* Field Creation Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingField ? 'Edit' : 'Create'} Form Field
              </h3>
              <button
                onClick={() => setShowFieldModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Area
                </label>
                <div className="p-2 bg-gray-100 rounded border text-sm">
                  {currentField.coordinates ?
                    `Rectangle: ${Math.round(currentField.coordinates.width)}x${Math.round(currentField.coordinates.height)}px` :
                    'No area selected'
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  value={currentField.label}
                  onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={currentField.type}
                  onChange={(e) => setCurrentField({ ...currentField, type: e.target.value as Field['type'] })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox (Yes/No)</option>
                  <option value="textarea">Textarea</option>
                  <option value="image">Image</option>
                  <option value="table">Table</option>
                </select>
              </div>

              {(currentField.type === 'select' || currentField.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="space-y-2">
                    {currentField.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} />
                      Add Option
                    </button>
                  </div>
                </div>
              )}
              
              {currentField.type === 'table' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Configuration
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-600">Initial Number of Rows</label>
                      <div className="text-xs text-gray-500 mb-1">
                        (Can be extended when filling the form)
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={currentField.tableConfig.rows}
                        onChange={(e) => setCurrentField({
                          ...currentField,
                          tableConfig: {
                            ...currentField.tableConfig,
                            rows: parseInt(e.target.value) || 1
                          }
                        })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Columns</label>
                      <div className="space-y-2">
                        {currentField.tableConfig.columns.map((column, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={column.label}
                              onChange={(e) => {
                                const newColumns = [...currentField.tableConfig.columns];
                                newColumns[index] = { 
                                  ...column, 
                                  label: e.target.value 
                                };
                                setCurrentField({
                                  ...currentField,
                                  tableConfig: {
                                    ...currentField.tableConfig,
                                    columns: newColumns
                                  }
                                });
                              }}
                              className="flex-1 p-2 border rounded-lg"
                              placeholder={`Column ${index + 1} header`}
                            />
                            <input
                              type="number"
                              min="50"
                              value={column.width}
                              onChange={(e) => {
                                const newColumns = [...currentField.tableConfig.columns];
                                newColumns[index] = { 
                                  ...column, 
                                  width: parseInt(e.target.value) || 100 
                                };
                                setCurrentField({
                                  ...currentField,
                                  tableConfig: {
                                    ...currentField.tableConfig,
                                    columns: newColumns
                                  }
                                });
                              }}
                              className="w-24 p-2 border rounded-lg"
                              placeholder="Width"
                            />
                            <button
                              onClick={() => {
                                const newColumns = currentField.tableConfig.columns.filter((_, i) => i !== index);
                                setCurrentField({
                                  ...currentField,
                                  tableConfig: {
                                    ...currentField.tableConfig,
                                    columns: newColumns
                                  }
                                });
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setCurrentField({
                              ...currentField,
                              tableConfig: {
                                ...currentField.tableConfig,
                                columns: [...currentField.tableConfig.columns, { 
                                  label: '', 
                                  width: 100,
                                  type: 'text'
                                }]
                              }
                            });
                          }}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus size={16} />
                          Add Column
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={currentField.required}
                  onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="required" className="text-sm font-medium text-gray-700">
                  Required field
                </label>
              </div>

              {/* Style Settings */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={currentField.style?.fontSize || '12'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          ...currentField.style,
                          fontSize: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={currentField.style?.color || '#000000'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          ...currentField.style,
                          color: e.target.value
                        }
                      })}
                      className="w-full p-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={currentField.style?.fontFamily || 'Palatino, "Palatino Linotype", serif'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          ...currentField.style,
                          fontFamily: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Palatino, &quot;Palatino Linotype&quot;, serif">Palatino</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={currentField.style?.fontWeight || 'normal'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          ...currentField.style,
                          fontWeight: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                      <option value="100">Thin (100)</option>
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Style
                  </label>
                  <select
                    value={currentField.style?.fontStyle || 'normal'}
                    onChange={(e) => setCurrentField({
                      ...currentField,
                      style: {
                        ...currentField.style,
                        fontStyle: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="oblique">Oblique</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addField}
                disabled={!currentField.label}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingField ? 'Update' : 'Add'} Field
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};