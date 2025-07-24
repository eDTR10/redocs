import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Eye, Save, FileDown } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  path: string;
}

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  coordinates: any;
  page: number;
  style?: {
    fontSize: string;
    color: string;
  };
  tableConfig?: {
    rows: number;
    columns: any[];
    data: any[];
  };
}

function ReadDocument() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const TEMPLATES = [
    { id: 'template1', name: 'Purchase Request Form 1', path: '/PR.pdf' },
  ];

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

  // Helper function to get field value by label
  const getFieldValueByLabel = (field: Field) => {
    return formData[field.label] || formData[field.id] || '';
  };

  const handleTemplateLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = TEMPLATES.find(t => t.id === e.target.value);
    if (selectedTemplate) {
      fetch(selectedTemplate.path)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], selectedTemplate.name + '.pdf', { type: 'application/pdf' });
          setPdfFile(file);
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
          renderPDF(url);
        });
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

  const drawOverlay = () => {
    if (!template?.fields || !overlayCanvasRef.current) return;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    template.fields.forEach((field: Field) => {
      if (field.coordinates) {
        ctx.fillStyle = field.style?.color || '#000000';
        ctx.font = `${field.style?.fontSize || '12'}px Arial`;

        const value = getFieldValueByLabel(field);

        switch (field.type) {
          case 'text':
          case 'email':
          case 'number':
            ctx.fillText(
              value || '',
              field.coordinates.x + 5,
              field.coordinates.y + (field.coordinates.height / 2) + 5
            );
            break;

          case 'textarea':
            const fontSize = parseInt(field.style?.fontSize || '12');
            const lineHeight = fontSize + 4;
            const lines = (value || '').split('\n');
            lines.forEach((line, index) => {
              ctx.fillText(
                line,
                field.coordinates.x + 5,
                field.coordinates.y + lineHeight + (index * lineHeight)
              );
            });
            break;

          case 'checkbox':
            if (value) {
              const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), field.coordinates.height - 4);
              ctx.fillRect(
                field.coordinates.x + 2,
                field.coordinates.y + (field.coordinates.height / 2) - (boxSize / 2),
                boxSize,
                boxSize
              );
            }
            break;

          case 'select':
            ctx.fillText(
              value || '',
              field.coordinates.x + 5,
              field.coordinates.y + (field.coordinates.height / 2) + 5
            );
            break;

          case 'date':
            const dateValue = value ? new Date(value).toLocaleDateString() : '';
            ctx.fillText(
              dateValue,
              field.coordinates.x + 5,
              field.coordinates.y + (field.coordinates.height / 2) + 5
            );
            break;

          case 'table':
            if (field.tableConfig) {
              const cellHeight = 25;
              let currentX = field.coordinates.x;
              
              field.tableConfig.columns.forEach((col, colIndex) => {
                const colWidth = col.width || field.coordinates.width / field.tableConfig.columns.length;
                
                for (let row = 0; row < field.tableConfig.rows; row++) {
                  const cellKey = `${field.label}_${row}_${colIndex}`;
                  const cellValue = formData[cellKey] || '';
                  if (cellValue) {
                    ctx.fillStyle = field.style?.color || '#000000';
                    ctx.font = `${field.style?.fontSize || '11'}px Arial`;
                    ctx.textAlign = 'center';
                    
                    const cellCenterX = currentX + (colWidth / 2);
                    const cellCenterY = field.coordinates.y + (row * cellHeight) + (cellHeight / 2);
                    
                    ctx.fillText(cellValue, cellCenterX, cellCenterY);
                  }
                }
                currentX += colWidth;
              });
              
              // Reset alignment
              ctx.textAlign = 'left';
            }
            break;
        }
      }
    });
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const template = JSON.parse(e.target.result as string);
          setTemplate(template);
          
          // Initialize form data using labels instead of IDs
          const initialData = template.fields.reduce((acc: Record<string, any>, field: Field) => {
            acc[field.label] = '';
            return acc;
          }, {});
          setFormData(initialData);

          // Load associated PDF if available
          if (template.document?.path) {
            setPdfUrl(template.document.path);
            renderPDF(template.document.path);
          }
        } catch (error) {
          console.error('Error parsing template:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFieldChange = (field: Field, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field.label]: value
    }));
    setTimeout(drawOverlay, 0);
  };

  const handleTableCellChange = (field: Field, row: number, col: number, value: any) => {
    const cellKey = `${field.label}_${row}_${col}`;
    setFormData(prev => ({
      ...prev,
      [cellKey]: value
    }));
    setTimeout(drawOverlay, 0);
  };

  const downloadData = () => {
    if (!template) return;

    // Create formData with labels as keys
    const labelBasedFormData = {};
    
    // Convert existing formData to use labels
    template.fields.forEach((field: Field) => {
      if (field.type === 'table' && field.tableConfig) {
        // Handle table fields
        for (let row = 0; row < field.tableConfig.rows; row++) {
          for (let col = 0; col < field.tableConfig.columns.length; col++) {
            const cellKey = `${field.label}_${row}_${col}`;
            if (formData[cellKey] !== undefined) {
              labelBasedFormData[cellKey] = formData[cellKey];
            }
          }
        }
      } else {
        // Handle regular fields
        if (formData[field.label] !== undefined) {
          labelBasedFormData[field.label] = formData[field.label];
        }
      }
    });

    const data = {
      template,
      formData: labelBasedFormData,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0"
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form_data_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    if (!pdfUrl || !canvasRef.current || !overlayCanvasRef.current || !window.pdfjsLib) return;

    try {
      // Load jsPDF library dynamically
      if (!window.jsPDF) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(1);
      
      // Create a new PDF document
      const { jsPDF } = window.jsPDF;
      const pdfDoc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Get page dimensions
      const viewport = page.getViewport({ scale: 1.0 });
      const pdfWidth = pdfDoc.internal.pageSize.getWidth();
      const pdfHeight = pdfDoc.internal.pageSize.getHeight();
      
      // Create a temporary canvas for high-resolution rendering
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Set canvas size to match PDF page
      const scale = Math.min(pdfWidth / viewport.width, pdfHeight / viewport.height);
      tempCanvas.width = viewport.width * scale;
      tempCanvas.height = viewport.height * scale;

      // Render the original PDF page
      const renderContext = {
        canvasContext: tempCtx,
        viewport: page.getViewport({ scale })
      };
      await page.render(renderContext).promise;

      // Draw the form data overlay
      if (template?.fields) {
        tempCtx.fillStyle = '#000000';
        tempCtx.font = '12px Arial';

        template.fields.forEach((field: Field) => {
          if (field.coordinates) {
            const value = getFieldValueByLabel(field);
            const x = field.coordinates.x * scale;
            const y = field.coordinates.y * scale;
            const height = field.coordinates.height * scale;

            tempCtx.fillStyle = field.style?.color || '#000000';
            tempCtx.font = `${parseInt(field.style?.fontSize || '12') * scale}px Arial`;

            switch (field.type) {
              case 'text':
              case 'email':
              case 'number':
              case 'select':
                tempCtx.fillText(value || '', x + 5, y + (height / 2) + 5);
                break;

              case 'textarea':
                const fontSize = parseInt(field.style?.fontSize || '12') * scale;
                const lineHeight = fontSize + 4;
                const lines = (value || '').split('\n');
                lines.forEach((line, index) => {
                  tempCtx.fillText(line, x + 5, y + lineHeight + (index * lineHeight));
                });
                break;

              case 'checkbox':
                if (value) {
                  const boxSize = Math.min(parseInt(field.style?.fontSize || '12') * scale, height - 4);
                  tempCtx.fillRect(x + 2, y + (height / 2) - (boxSize / 2), boxSize, boxSize);
                }
                break;

              case 'date':
                const dateValue = value ? new Date(value).toLocaleDateString() : '';
                tempCtx.fillText(dateValue, x + 5, y + (height / 2) + 5);
                break;

              case 'table':
                if (field.tableConfig) {
                  const cellHeight = 25 * scale;
                  let currentX = x;
                  
                  field.tableConfig.columns.forEach((col, colIndex) => {
                    const colWidth = (col.width || field.coordinates.width / field.tableConfig.columns.length) * scale;
                    
                    for (let row = 0; row < field.tableConfig.rows; row++) {
                      const cellKey = `${field.label}_${row}_${colIndex}`;
                      const cellValue = formData[cellKey] || '';
                      if (cellValue) {
                        tempCtx.textAlign = 'center';
                        const cellCenterX = currentX + (colWidth / 2);
                        const cellCenterY = y + (row * cellHeight) + (cellHeight / 2);
                        tempCtx.fillText(cellValue, cellCenterX, cellCenterY);
                      }
                    }
                    currentX += colWidth;
                  });
                  tempCtx.textAlign = 'left';
                }
                break;
            }
          }
        });
      }

      // Convert canvas to image and add to PDF
      const imgData = tempCanvas.toDataURL('image/png');
      pdfDoc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Save the PDF
      pdfDoc.save(`filled_form_${new Date().toISOString()}.pdf`);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to image download if PDF generation fails
      const combinedCanvas = document.createElement('canvas');
      const combinedCtx = combinedCanvas.getContext('2d');
      
      if (combinedCtx) {
        combinedCanvas.width = canvasRef.current.width;
        combinedCanvas.height = canvasRef.current.height;
        combinedCtx.drawImage(canvasRef.current, 0, 0);
        combinedCtx.drawImage(overlayCanvasRef.current, 0, 0);

        combinedCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `filled_form_${new Date().toISOString()}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    }
  };

  const renderFieldInput = (field: Field) => {
    const fieldValue = getFieldValueByLabel(field);

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full p-2 border rounded"
            placeholder={field.label}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full p-2 border rounded"
            placeholder={field.label}
            required={field.required}
            rows={3}
          />
        );

      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full p-2 border rounded"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={fieldValue || false}
            onChange={(e) => handleFieldChange(field, e.target.checked)}
            className="w-4 h-4"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full p-2 border rounded"
            required={field.required}
          />
        );

      case 'table':
        if (!field.tableConfig) return null;
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {field.tableConfig.columns.map((col, i) => (
                    <th key={i} className="border p-2 bg-gray-50">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array(field.tableConfig.rows).fill(0).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {field.tableConfig.columns.map((_, colIndex) => {
                      const cellKey = `${field.label}_${rowIndex}_${colIndex}`;
                      return (
                        <td key={colIndex} className="border p-2">
                          <input
                            type="text"
                            value={formData[cellKey] || ''}
                            onChange={(e) => handleTableCellChange(field, rowIndex, colIndex, e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Document Reader</h1>
            <div className="flex gap-4">
              <select
                onChange={handleTemplateLoad}
                className="px-4 py-2 border rounded-lg"
                defaultValue=""
              >
                <option value="" disabled>Select Template</option>
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <button
                onClick={() => document.getElementById('template-upload')?.click()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Upload size={20} />
                Load Template
              </button>

              <button
                onClick={downloadData}
                disabled={!template}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Save size={20} />
                Save Form Data
              </button>

              <button
                onClick={downloadPDF}
                disabled={!pdfUrl}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                <FileDown size={20} />
                Download PDF
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                <Eye size={20} />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
          </div>

          <input
            id="template-upload"
            type="file"
            accept=".json"
            onChange={handleTemplateUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Preview */}
            {showPreview && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Document Preview</h2>
                <div className="relative inline-block">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 max-w-full"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                  />
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Form Fields</h2>
              {template ? (
                <div className="space-y-4">
                  {template.fields.map((field: Field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No template loaded. Please load a template to start.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadDocument;