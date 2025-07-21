import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, Trash2, Save, Eye, Settings, List, Move, Edit, X } from 'lucide-react';

function DocumentManage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [currentField, setCurrentField] = useState<Field>({
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
      color: '#000000'
    }
  });
  const [jsonTemplate, setJsonTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Coordinates | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [previewValues, setPreviewValues] = useState({});
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // PDF.js setup
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      renderPDF(url);
    }
  };

  const renderPDF = async (url: string) => {
    if (!window.pdfjsLib) return;

    try {
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!canvas || !overlayCanvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      overlayCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      drawOverlay();
    } catch (error) {
      console.error('Error rendering PDF:', error);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;

    const point = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentRect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode) return;

    const point = getCanvasCoordinates(e);
    const newRect = {
      x: Math.min(startPoint.x, point.x),
      y: Math.min(startPoint.y, point.y),
      width: Math.abs(point.x - startPoint.x),
      height: Math.abs(point.y - startPoint.y)
    };

    setCurrentRect(newRect);
    drawOverlay();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode) return;

    const point = getCanvasCoordinates(e);
    const finalRect = {
      x: Math.min(startPoint.x, point.x),
      y: Math.min(startPoint.y, point.y),
      width: Math.abs(point.x - startPoint.x),
      height: Math.abs(point.y - startPoint.y)
    };

    if (finalRect.width > 10 && finalRect.height > 10) {
      setCurrentField({
        id: `field_${Date.now()}`,
        label: `Field ${fields.length + 1}`,
        type: 'text',
        required: false,
        options: [],
        coordinates: finalRect,
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
        }
      });
      setShowFieldModal(true);
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setDrawingMode(false);
  };

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

  const drawOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    const canvas = canvasRef.current;

    if (!overlayCanvas || !canvas) return;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw existing fields
    fields.forEach(field => {
      if (field.coordinates) {
        if (!showPreviewMode) {
          // Only draw field highlights in edit mode
          const colors = getFieldColor(field.type);
          ctx.strokeStyle = colors.stroke;
          ctx.fillStyle = colors.fill;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          ctx.fillRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
          ctx.strokeRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
          
          // Draw field type indicator and label in edit mode
          ctx.fillStyle = colors.stroke;
          ctx.font = 'bold 10px Arial';
          const typeIndicator = field.type.toUpperCase();
          ctx.fillText(typeIndicator, field.coordinates.x + 5, field.coordinates.y + 15);
          
          ctx.fillStyle = '#1f2937';
          ctx.font = '12px Arial';
          const labelY = field.coordinates.y - 5;
          ctx.fillText(field.label, field.coordinates.x + 5, labelY);
        }

        // Draw field values
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        
        switch (field.type) {
          case 'text':
          case 'email':
          case 'number':
            const value = previewValues[field.id] || '';
            ctx.fillStyle = field.style?.color || '#000000';
            ctx.font = `${field.style?.fontSize || '12'}px Arial`;
            ctx.fillText(value, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
            break;

          case 'date':
            const dateValue = previewValues[field.id] ? new Date(previewValues[field.id]).toLocaleDateString() : '';
            ctx.fillText(dateValue, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
            break;

          case 'select':
            const selectValue = previewValues[field.id] || '';
            ctx.fillText(selectValue, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
            break;

          case 'checkbox':
            const isChecked = previewValues[field.id];
            ctx.fillStyle = field.style?.color || '#000000';
            
            // Draw checkbox outline with smaller size
            ctx.strokeStyle = field.style?.color || '#000000';
            ctx.lineWidth = 1;
            const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), field.coordinates.height - 4);
            const x = field.coordinates.x + 2;
            const y = field.coordinates.y + (field.coordinates.height / 2) - (boxSize / 2);
            
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            if (isChecked) {
              // Fill checkbox with solid color when checked
              ctx.fillStyle = field.style?.color || '#000000';
              ctx.fillRect(x + 1, y + 1, boxSize - 2, boxSize - 2);
            }
            break;

          case 'textarea':
            const textareaValue = previewValues[field.id] || '';
            const fontSize = parseInt(field.style?.fontSize || '12');
            const lineHeight = fontSize + 4;
            const maxLines = Math.floor(field.coordinates.height / lineHeight);
            
            ctx.fillStyle = field.style?.color || '#000000';
            ctx.font = `${fontSize}px Arial`;
            
            // Word wrapping function
            const wrapText = (text, maxWidth) => {
              const words = text.split(' ');
              const lines = [];
              let currentLine = words[0];

              for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth - 10) {
                  currentLine += ' ' + word;
                } else {
                  lines.push(currentLine);
                  currentLine = word;
                }
              }
              lines.push(currentLine);
              return lines;
            };

            // Handle multiple paragraphs
            const paragraphs = textareaValue.split('\n');
            let currentY = field.coordinates.y + lineHeight;
            let lineCount = 0;

            for (const paragraph of paragraphs) {
              if (lineCount >= maxLines) break;
              
              const wrappedLines = wrapText(paragraph, field.coordinates.width);
              for (const line of wrappedLines) {
                if (lineCount >= maxLines) break;
                
                ctx.fillText(
                  line,
                  field.coordinates.x + 5,
                  currentY
                );
                
                currentY += lineHeight;
                lineCount++;
              }
            }
            break;

          case 'image':
            const imageData = previewValues[field.id];
            if (imageData) {
              const img = new Image();
              img.src = imageData;
              img.onload = () => {
                // Calculate scaling to fit within field bounds while maintaining aspect ratio
                const scale = Math.min(
                  field.coordinates.width / img.width,
                  field.coordinates.height / img.height
                );
                const width = img.width * scale;
                const height = img.height * scale;
                const x = field.coordinates.x + (field.coordinates.width - width) / 2;
                const y = field.coordinates.y + (field.coordinates.height - height) / 2;
                
                ctx.drawImage(img, x, y, width, height);
              };
            } else {
              // Draw placeholder
              ctx.strokeStyle = '#CBD5E1';
              ctx.strokeRect(
                field.coordinates.x,
                field.coordinates.y,
                field.coordinates.width,
                field.coordinates.height
              );
              ctx.fillStyle = '#94A3B8';
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(
                'No image uploaded',
                field.coordinates.x + field.coordinates.width / 2,
                field.coordinates.y + field.coordinates.height / 2
              );
              ctx.textAlign = 'left';
            }
            break;

          case 'table':
            const cellHeight = 25;
            let maxY = field.coordinates.y;
            let hasContent = false;
            let lastContentY = field.coordinates.y;
            
            let currentX = field.coordinates.x;
            field.tableConfig.columns.forEach((col, colIndex) => {
              const colWidth = col.width || field.coordinates.width / field.tableConfig.columns.length;
              
              for (let row = 0; row < field.tableConfig.rows; row++) {
                const cellValue = previewValues[`${field.id}_${row}_${colIndex}`] || '';
                if (cellValue) {
                  hasContent = true;
                  ctx.fillStyle = field.style?.color || '#000000';
                  ctx.font = `${field.style?.fontSize || '11'}px Arial`;
                  ctx.textAlign = 'center';
                  
                  const cellCenterX = currentX + (colWidth / 2);
                  const cellCenterY = field.coordinates.y + (row * cellHeight) + (cellHeight / 2);
                  
                  // Adjust text position higher in the cell
                  ctx.fillText(cellValue, cellCenterX, cellCenterY);
                  lastContentY = Math.max(lastContentY, cellCenterY + (cellHeight/2));
                }
              }
              currentX += colWidth;
            });
            
            // Draw grid lines in edit mode
            if (!showPreviewMode) {
              // Vertical lines
              currentX = field.coordinates.x;
              field.tableConfig.columns.forEach((col) => {
                const colWidth = col.width || field.coordinates.width / field.tableConfig.columns.length;
                ctx.beginPath();
                ctx.moveTo(currentX, field.coordinates.y);
                ctx.lineTo(currentX, field.coordinates.y + (cellHeight * field.tableConfig.rows));
                ctx.stroke();
                currentX += colWidth;
              });
              
              // Final vertical line
              ctx.beginPath();
              ctx.moveTo(currentX, field.coordinates.y);
              ctx.lineTo(currentX, field.coordinates.y + (cellHeight * field.tableConfig.rows));
              ctx.stroke();
              
              // Horizontal lines
              for (let i = 0; i <= field.tableConfig.rows; i++) {
                ctx.beginPath();
                ctx.moveTo(field.coordinates.x, field.coordinates.y + (i * cellHeight));
                ctx.lineTo(field.coordinates.x + field.coordinates.width, field.coordinates.y + (i * cellHeight));
                ctx.stroke();
              }
            }
            
            // Draw "nothing follows" text immediately after the last content
            if (hasContent) {
              const footerY = lastContentY + 5; // Reduced spacing
              ctx.font = '11px Arial';
              ctx.fillStyle = '#666666';
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'center';
              
              // Draw centered footer text without the line
              ctx.fillText(
                'xxx nothing follows xxx',
                field.coordinates.x + (field.coordinates.width / 2),
                footerY
              );
            }
            
            // Reset text alignment
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            break;
        }
        
        // Draw required indicator only in edit mode
        if (!showPreviewMode && field.required) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('*', field.coordinates.x + field.coordinates.width - 15, field.coordinates.y + 15);
        }
      }
    });
    
    // Draw current rectangle being drawn (only in edit mode)
    if (!showPreviewMode && currentRect && isDrawing) {
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Arial';
      ctx.setLineDash([]);
      const dimensions = `${Math.round(currentRect.width)}x${Math.round(currentRect.height)}`;
      ctx.fillText(dimensions, currentRect.x + 5, currentRect.y + currentRect.height + 15);
    }
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
        color: '#000000'
      }
    });
    drawOverlay();
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    setTimeout(drawOverlay, 0);
  };

  const generateJsonTemplate = () => {
    const template = {
      document: {
        name: pdfFile ? pdfFile.name : 'untitled.pdf',
        version: '1.0',
        created: new Date().toISOString()
      },
      fields: fields.map(field => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        ...(field.type === 'select' && { options: field.options }),
        ...(field.type === 'checkbox' && { value: false }),
        ...(field.type === 'table' && { 
          tableConfig: {
            rows: field.tableConfig.rows,
            expandable: true, // Allow adding more rows
            columns: field.tableConfig.columns.map(col => ({
              label: col.label,
              width: col.width,
              type: col.type || 'text'
            })),
            data: Array(field.tableConfig.rows).fill(
              Array(field.tableConfig.columns.length).fill('')
            )
          }
        }),
        coordinates: field.coordinates,
        page: field.page,
        style: field.style || {
          fontSize: '12',
          color: '#000000'
        }
      })),
      schema: fields.reduce((acc: Record<string, any>, field) => {
        acc[field.id] = {
          type: field.type,
          required: field.required,
          label: field.label,
          ...(field.type === 'table' && { tableConfig: field.tableConfig })
        };
        return acc;
      }, {}),
      _metadata: {
        generated: new Date().toISOString(),
        version: "1.0.0"
      },
      _footer: "xxx nothing follows xxx"
    };

    const jsonString = JSON.stringify(template, null, 2);
    setJsonTemplate(jsonString);
  };

  const downloadTemplate = () => {
    const blob = new Blob([jsonTemplate], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFile ? pdfFile.name.replace('.pdf', '') : 'template'}_fields.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  // List configuration functions
  const addListColumn = () => {
    setCurrentField({
      ...currentField,
      listConfig: {
        ...currentField.listConfig,
        columns: [...currentField.listConfig.columns, {
          id: `col_${Date.now()}`,
          label: '',
          type: 'text',
          required: false,
          width: 100
        }]
      }
    });
  };

  const updateListColumn = (index, property, value) => {
    const newColumns = [...currentField.listConfig.columns];
    newColumns[index] = { ...newColumns[index], [property]: value };
    setCurrentField({
      ...currentField,
      listConfig: {
        ...currentField.listConfig,
        columns: newColumns
      }
    });
  };

  const removeListColumn = (index) => {
    setCurrentField({
      ...currentField,
      listConfig: {
        ...currentField.listConfig,
        columns: currentField.listConfig.columns.filter((_, i) => i !== index)
      }
    });
  };

  const moveListColumn = (index, direction) => {
    const newColumns = [...currentField.listConfig.columns];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newColumns.length) {
      [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
      setCurrentField({
        ...currentField,
        listConfig: {
          ...currentField.listConfig,
          columns: newColumns
        }
      });
    }
  };

  const editField = (field) => {
    setEditingField(field);
    setCurrentField(field);
    setShowFieldModal(true);
  };

  const renderFieldPreview = (field) => {
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
      default:
        return <div className="text-sm text-gray-500">Preview not available</div>;
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'a') {
          e.preventDefault();
          setDrawingMode(true);
        } else if (e.key === 'q') {
          e.preventDefault();
          setShowPreviewMode(!showPreviewMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPreviewMode]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">PDF Document Manager</h1>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={20} />
                Upload PDF
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const template = JSON.parse(event.target.result);
                          setFields(template.fields.map(field => ({
                            ...field,
                            tableConfig: field.tableConfig || {
                              rows: 1,
                              columns: [],
                              data: []
                            },
                            listConfig: {
                              minItems: 1,
                              maxItems: 10,
                              columns: []
                            }
                          })));
                          if (template.values) {
                            setPreviewValues(template.values);
                          }
                        } catch (error) {
                          console.error('Error parsing JSON template:', error);
                          alert('Invalid JSON template file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Upload size={20} />
                Import Template
              </button>
              <button
                onClick={() => setDrawingMode(true)}
                disabled={!pdfUrl}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
                Add Field
              </button>
              <button
                onClick={() => setShowPreviewMode(!showPreviewMode)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
              >
                <Eye size={16} />
                {showPreviewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {pdfFile && (
                <span className="text-sm text-gray-600">
                  {pdfFile.name}
                </span>
              )}
              {drawingMode && (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg">
                  <Settings size={16} />
                  <span className="text-sm font-medium">Drawing Mode Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Viewer */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">PDF Viewer</h2>
                {pdfUrl ? (
                  <div className="relative inline-block">
                    <canvas
                      ref={canvasRef}
                      className="border border-gray-300 max-w-full"
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute top-0 left-0 border border-gray-300 max-w-full pointer-events-none"
                      style={{
                        cursor: drawingMode ? 'crosshair' : 'default',
                        pointerEvents: drawingMode ? 'auto' : 'none'
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    />
                    <div className="mt-4 text-sm text-gray-600">
                      {drawingMode ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Click and drag to draw a rectangle for your field
                        </div>
                      ) : (
                        <>💡 Click "Add Field" button to start drawing field areas</>
                      )}
                    </div>
                    <div className="mt-4 text-sm">
                      <div className="font-medium text-gray-700 mb-2">Field Legend:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-blue-500 bg-blue-100"></span>
                          Text
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-green-500 bg-green-100"></span>
                          Number
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-yellow-500 bg-yellow-100"></span>
                          Email
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-purple-500 bg-purple-100"></span>
                          Date
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-cyan-500 bg-cyan-100"></span>
                          Select
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-lime-500 bg-lime-100"></span>
                          Checkbox
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-gray-500 bg-gray-100"></span>
                          Textarea
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-pink-500 bg-pink-100"></span>
                          Image
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-orange-500 bg-orange-100"></span>
                          List
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border-2 border-indigo-500 bg-indigo-100"></span>
                          Table
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        * = Required field
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    Upload a PDF to get started
                  </div>
                )}
              </div>
            </div>

            {/* Field Management */}
            <div className="space-y-6">
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
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={generateJsonTemplate}
                  disabled={fields.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={20} />
                  Generate Template
                </button>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!jsonTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={20} />
                  {showPreview ? 'Hide' : 'Show'} JSON
                </button>

                <button
                  onClick={downloadTemplate}
                  disabled={!jsonTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={20} />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          {showPreview && jsonTemplate && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">JSON Template</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {jsonTemplate}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Field Creation Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Form Field</h3>
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
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentManage;