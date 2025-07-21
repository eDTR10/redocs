import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, Trash2, Save, Eye, Settings } from 'lucide-react';

// Type definitions
interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ListColumn {
  id: string;
  label: string;
  type: string;
  required: boolean;
  width: number;
}

interface ListConfig {
  minItems: number;
  maxItems: number;
  columns: ListColumn[];
}

interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea' | 'image' | 'list';
  required: boolean;
  options: string[];
  coordinates: Coordinates | null;
  page: number;
  listConfig: ListConfig;
}

interface PDFLib {
  getDocument: (url: string) => { promise: Promise<any> };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PDFLib;
  }
}

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
    }
  });
  const [jsonTemplate, setJsonTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Coordinates | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      list: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.1)' }
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
        const colors = getFieldColor(field.type);
        ctx.strokeStyle = colors.stroke;
        ctx.fillStyle = colors.fill;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        ctx.fillRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
        ctx.strokeRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);

        // Draw field type icon/indicator
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 10px Arial';
        const typeIndicator = field.type.toUpperCase();
        ctx.fillText(typeIndicator, field.coordinates.x + 5, field.coordinates.y + 15);

        // Draw field label
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Arial';
        const labelY = field.coordinates.y - 5;
        ctx.fillText(field.label, field.coordinates.x + 5, labelY);

        // Draw field placeholder/preview content
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Arial';
        let previewText = '';

        switch (field.type) {
          case 'text':
            previewText = 'Enter text...';
            break;
          case 'number':
            previewText = '123';
            break;
          case 'email':
            previewText = 'user@example.com';
            break;
          case 'date':
            previewText = 'MM/DD/YYYY';
            break;
          case 'select':
            previewText = field.options.length > 0 ? `▼ ${field.options[0]}` : '▼ Select...';
            break;
          case 'checkbox':
            previewText = '☐ Check options';
            break;
          case 'textarea':
            previewText = 'Enter long text...';
            break;
          case 'image':
            previewText = '🖼️ Image upload';
            break;
          case 'list':
            if (field.listConfig.columns.length > 0) {
              previewText = `📋 ${field.listConfig.columns.map(col => col.label).join(' | ')}`;
            } else {
              previewText = '📋 Dynamic list';
            }
            break;
        }

        if (previewText) {
          const textY = field.coordinates.y + field.coordinates.height - 10;
          ctx.fillText(previewText, field.coordinates.x + 5, textY);
        }

        // Draw required indicator
        if (field.required) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('*', field.coordinates.x + field.coordinates.width - 15, field.coordinates.y + 15);
        }
      }
    });

    // Draw current rectangle being drawn
    if (currentRect && isDrawing) {
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);

      // Show dimensions while drawing
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Arial';
      ctx.setLineDash([]);
      const dimensions = `${Math.round(currentRect.width)}x${Math.round(currentRect.height)}`;
      ctx.fillText(dimensions, currentRect.x + 5, currentRect.y + currentRect.height + 15);
    }
  };

  const addField = () => {
    setFields([...fields, { ...currentField }]);
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
        ...(field.options.length > 0 && { options: field.options }),
        ...(field.type === 'list' && { listConfig: field.listConfig }),
        coordinates: field.coordinates,
        page: field.page
      })),
      schema: fields.reduce((acc: Record<string, any>, field) => {
        acc[field.id] = {
          type: field.type,
          required: field.required,
          label: field.label,
          ...(field.type === 'list' && { listConfig: field.listConfig })
        };
        return acc;
      }, {})
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
                onClick={() => setDrawingMode(true)}
                disabled={!pdfUrl}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
                Add Field
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
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm border-2"
                            style={{
                              borderColor: getFieldColor(field.type).stroke,
                              backgroundColor: getFieldColor(field.type).fill
                            }}
                          ></span>
                          {field.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {field.type} {field.required && '(required)'}
                          {field.type === 'list' && ` - ${field.listConfig.columns.length} columns`}
                        </div>
                      </div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
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
            <h3 className="text-lg font-semibold mb-4">Create Form Field</h3>

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
                  <option value="checkbox">Checkbox</option>
                  <option value="textarea">Textarea</option>
                  <option value="image">Image</option>
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