import React, { useRef, useEffect, useState } from 'react';
import { evaluate } from 'mathjs';

// Field interface definition
interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group' | 'signature';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
  formula?: string; // Add formula property for calculated fields
  listConfig?: {
    minItems: number;
    maxItems: number;
    columns: any[];
  };
  tableConfig?: {
    rows: number;
    columns: any[];
    data: any[];
  };
  groupConfig?: {
    fields: Field[];
    additionalFields?: any[]; // For non-visual fields
  };
  style?: {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
  };
}

interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Formula evaluation function with circular reference protection
const evaluateFormula = (formula: string, fields: Field[], previewValues: Record<string, any>, evaluating = new Set<string>(), currentRow?: number, currentTableField?: Field): number => {
  if (!formula.trim()) return 0;
  
  try {
    let processedFormula = formula;
    
    // Handle table column references (table.columnName format)
    if (currentRow !== undefined && currentTableField?.tableConfig) {
      const tableColumnRegex = /table\.(\w+)/g;
      processedFormula = processedFormula.replace(tableColumnRegex, (match, columnName) => {
        // Find the column index by name (case-insensitive)
        const columnIndex = currentTableField.tableConfig.columns.findIndex(
          col => col.label.toLowerCase().replace(/\s+/g, '') === columnName.toLowerCase()
        );
        
        if (columnIndex !== -1) {
          const cellKey = `${currentTableField.id}_${currentRow}_${columnIndex}`;
          const cellValue = previewValues[cellKey];
          console.log(`Table formula: ${match} -> ${cellKey} = ${cellValue}`);
          
          if (cellValue !== undefined && cellValue !== '') {
            const numericValue = parseFloat(cellValue) || 0;
            return numericValue.toString();
          }
        }
        
        console.warn(`Column ${columnName} not found in table ${currentTableField.id}`);
        return '0';
      });
    }
    
    // Replace field references with their values
    fields.forEach(field => {
      if (!field.id) return;
      
      // Check for circular reference
      if (evaluating.has(field.id)) {
        console.warn(`Circular reference detected for field: ${field.id}`);
        return;
      }
      
      const fieldRegex = new RegExp(`\\b${field.id}\\b`, 'g');
      if (processedFormula.match(fieldRegex)) {
        let fieldValue = 0;
        
        if (field.formula && field.formula.trim()) {
          // This is a calculated field, evaluate its formula first
          evaluating.add(field.id);
          fieldValue = evaluateFormula(field.formula, fields, previewValues, evaluating);
          evaluating.delete(field.id);
        } else {
          // Regular field, get its value
          fieldValue = parseFloat(previewValues[field.id] || '0') || 0;
        }
        
        processedFormula = processedFormula.replace(fieldRegex, fieldValue.toString());
      }
    });
    
    // Handle table field references (table_row_col format)
    const tableFieldRegex = /table_(\d+)_(\d+)/g;
    processedFormula = processedFormula.replace(tableFieldRegex, (match, row, col) => {
      // Find any table field and try to get the cell value
      const rowIndex = parseInt(row);
      const colIndex = parseInt(col);
      
      console.log(`Looking for table cell: table_${rowIndex}_${colIndex}`);
      
      // Look for cell values in the format: tableFieldId_row_col
      for (const field of fields) {
        if (field.type === 'table' && field.id) {
          const cellKey = `${field.id}_${rowIndex}_${colIndex}`;
          const cellValue = previewValues[cellKey];
          console.log(`Checking field ${field.id}, key: ${cellKey}, value:`, cellValue);
          
          if (cellValue !== undefined && cellValue !== '') {
            // Check if this cell has a formula
            const column = field.tableConfig?.columns?.[colIndex];
            if (column && column.formula) {
              // Evaluate the cell formula
              const cellFormula = column.formula.replace(/row/g, rowIndex.toString());
              try {
                return evaluate(cellFormula).toString();
              } catch (e) {
                console.warn(`Error evaluating cell formula: ${e}`);
                return '0';
              }
            }
            
            const numericValue = parseFloat(cellValue) || 0;
            console.log(`Returning numeric value: ${numericValue}`);
            return numericValue.toString();
          }
        }
      }
      
      console.log(`No value found for table_${rowIndex}_${colIndex}, returning 0`);
      return '0';
    });
    
    console.log(`Final processed formula: ${processedFormula}`);
    
    const result = evaluate(processedFormula);
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 0;
  }
};

// Helper function to get field value (with formula evaluation)
const getFieldValue = (field: Field, fields: Field[], previewValues: Record<string, any>, currentRow?: number, currentTableField?: Field): string => {
  if (field.formula && field.formula.trim()) {
    // This is a calculated field, evaluate the formula
    console.log(`Evaluating formula for field ${field.id}:`, field.formula);
    console.log('Available preview values:', previewValues);
    const result = evaluateFormula(field.formula, fields, previewValues, new Set<string>(), currentRow, currentTableField);
    console.log(`Formula result:`, result);
    return result.toString();
  }
  // Regular field, return the preview value
  return previewValues[field.id] || '';
};

interface PDFViewerProps {
  pdfUrl: string | null;
  fields: Field[];
  setFields: (fields: Field[]) => void;
  currentField: Field;
  setCurrentField: (field: Field) => void;
  showFieldModal: boolean;
  setShowFieldModal: (show: boolean) => void;
  drawingMode: boolean;
  setDrawingMode: (mode: boolean) => void;
  showPreviewMode: boolean;
  previewValues: Record<string, any>;
  setPreviewValues: (values: Record<string, any>) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  fields,
  setFields,
  currentField,
  setCurrentField,
  showFieldModal,
  setShowFieldModal,
  drawingMode,
  setDrawingMode,
  showPreviewMode,
  previewValues,
  setPreviewValues
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Coordinates | null>(null);

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

  useEffect(() => {
    if (pdfUrl) {
      renderPDF(pdfUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    drawOverlay();
  }, [fields, currentRect, showPreviewMode, previewValues]);

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
        ...currentField,
        id: `field_${Date.now()}`,
        label: `Field ${fields.length + 1}`,
        coordinates: finalRect,
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

  // Helper function to construct font string with all styles
  const getFontString = (field: Field, size?: string) => {
    const fontSize = size || field.style?.fontSize || '12';
    const fontWeight = field.style?.fontWeight || 'normal';
    const fontStyle = field.style?.fontStyle || 'normal';
    const fontFamily = field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif';
    
    return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
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
      if (field.type === 'group') {
        // For group fields, show container outline only in edit mode
        if (!showPreviewMode && field.groupConfig?.fields?.length > 0) {
          // Calculate bounding box from all sub-fields
          const subFieldCoords = field.groupConfig.fields
            .filter(f => f.coordinates)
            .map(f => f.coordinates);
          
          if (subFieldCoords.length > 0) {
            const minX = Math.min(...subFieldCoords.map(c => c.x));
            const minY = Math.min(...subFieldCoords.map(c => c.y));
            const maxX = Math.max(...subFieldCoords.map(c => c.x + c.width));
            const maxY = Math.max(...subFieldCoords.map(c => c.y + c.height));
            
            ctx.strokeStyle = '#9333ea';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.strokeRect(minX - 5, minY - 25, maxX - minX + 10, maxY - minY + 30);
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#9333ea';
            ctx.font = 'bold 12px Palatino, "Palatino Linotype", serif';
            ctx.fillText(`GROUP: ${field.label}`, minX, minY - 10);
          }
        }
        
        // Draw field values for group sub-fields
        drawFieldValues(ctx, field);
        
        // Draw required indicator for group in edit mode
        if (!showPreviewMode && field.required && field.groupConfig?.fields?.length > 0) {
          const subFieldCoords = field.groupConfig.fields
            .filter(f => f.coordinates)
            .map(f => f.coordinates);
        
          if (subFieldCoords.length > 0) {
            const maxX = Math.max(...subFieldCoords.map(c => c.x + c.width));
            const minY = Math.min(...subFieldCoords.map(c => c.y));
            
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px Palatino, "Palatino Linotype", serif';
            ctx.fillText('*', maxX - 10, minY - 10);
          }
        }
      } else if (field.coordinates) {
        // Original code for non-group fields
        if (!showPreviewMode) {
          // Only draw field highlights in edit mode
          const colors = getFieldColor(field.type);
          ctx.strokeStyle = colors.stroke;
          ctx.fillStyle = colors.fill;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          ctx.fillRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
          ctx.strokeRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
          
          // Draw field type indicator and label in edit mode with Palatino font
          ctx.fillStyle = colors.stroke;
          ctx.font = 'bold 10px Palatino, "Palatino Linotype", serif';
          const typeIndicator = field.type.toUpperCase();
          ctx.fillText(typeIndicator, field.coordinates.x + 5, field.coordinates.y + 15);
          
          ctx.fillStyle = '#1f2937';
          ctx.font = '12px Palatino, "Palatino Linotype", serif';
          const labelY = field.coordinates.y - 5;
          ctx.fillText(field.label, field.coordinates.x + 5, labelY);
        }

        // Draw field values
        drawFieldValues(ctx, field);
        
        // Draw required indicator only in edit mode
        if (!showPreviewMode && field.required) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px Palatino, "Palatino Linotype", serif';
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
      ctx.font = '10px Palatino, "Palatino Linotype", serif';
      ctx.setLineDash([]);
      const dimensions = `${Math.round(currentRect.width)}x${Math.round(currentRect.height)}`;
      ctx.fillText(dimensions, currentRect.x + 5, currentRect.y + currentRect.height + 15);
    }
  };

  const drawFieldValues = (ctx: CanvasRenderingContext2D, field: Field) => {
    // For group fields, we don't need coordinates for the group itself, 
    // just render the sub-fields that have coordinates
    if (field.type === 'group') {
      // Render sub-fields that have coordinates
      if (field.groupConfig?.fields) {
        const groupData = previewValues[field.id] || {};
        
        field.groupConfig.fields.forEach(subField => {
          if (!subField.coordinates) return;
          
          const subValue = groupData[subField.id];
          ctx.fillStyle = subField.style?.color || '#000000';
          ctx.font = getFontString(subField);
          
          switch (subField.type) {
            case 'text':
            case 'email':
            case 'number':
              const subFieldValue = getFieldValue(subField, fields, { ...previewValues, ...groupData });
              if (subFieldValue) {
                ctx.fillText(subFieldValue, subField.coordinates.x + 5, subField.coordinates.y + (subField.coordinates.height / 2) + 5);
              }
              break;
              
            case 'checkbox':
              const subIsChecked = subValue;
              ctx.strokeStyle = subField.style?.color || '#000000';
              ctx.lineWidth = 1;
              const subBoxSize = Math.min(parseInt(subField.style?.fontSize || '12'), subField.coordinates.height - 4);
              const subX = subField.coordinates.x + 2;
              const subY = subField.coordinates.y + (subField.coordinates.height / 2) - (subBoxSize / 2);
              
              ctx.strokeRect(subX, subY, subBoxSize, subBoxSize);
              
              if (subIsChecked) {
                ctx.fillStyle = subField.style?.color || '#000000';
                ctx.fillRect(subX + 1, subY + 1, subBoxSize - 2, subBoxSize - 2);
              }
              break;
              
            case 'textarea':
              if (subValue) {
                const subFontSize = parseInt(subField.style?.fontSize || '12');
                const subLineHeight = subFontSize + 4;
                const subMaxLines = Math.floor(subField.coordinates.height / subLineHeight);
                
                const subWrapText = (text: string, maxWidth: number) => {
                  const words = text.split(' ');
                  const lines = [];
                  let currentLine = words[0] || '';

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
                  if (currentLine) lines.push(currentLine);
                  return lines;
                };

                const subParagraphs = subValue.split('\n');
                let currentY = subField.coordinates.y + subLineHeight;
                let lineCount = 0;

                for (const paragraph of subParagraphs) {
                  if (lineCount >= subMaxLines) break;
                  
                  const wrappedLines = subWrapText(paragraph, subField.coordinates.width);
                  for (const line of wrappedLines) {
                    if (lineCount >= subMaxLines) break;
                    
                    ctx.fillText(
                      line,
                      subField.coordinates.x + 5,
                      currentY
                    );
                    
                    currentY += subLineHeight;
                    lineCount++;
                  }
                }
              }
              break;

            case 'image':
              const imageData = subValue;
              if (imageData) {
                const img = new Image();
                img.src = imageData;
                img.onload = () => {
                  const scale = Math.min(
                    subField.coordinates.width / img.width,
                    subField.coordinates.height / img.height
                  );
                  const width = img.width * scale;
                  const height = img.height * scale;
                  const x = subField.coordinates.x + (subField.coordinates.width - width) / 2;
                  const y = subField.coordinates.y + (subField.coordinates.height - height) / 2;
                  
                  ctx.drawImage(img, x, y, width, height);
                };
              } else {
                ctx.strokeStyle = '#CBD5E1';
                ctx.strokeRect(
                  subField.coordinates.x,
                  subField.coordinates.y,
                  subField.coordinates.width,
                  subField.coordinates.height
                );
                ctx.fillStyle = '#94A3B8';
                ctx.font = getFontString(subField);
                ctx.textAlign = 'center';
                ctx.fillText(
                  'No image uploaded',
                  subField.coordinates.x + subField.coordinates.width / 2,
                  subField.coordinates.y + subField.coordinates.height / 2
                );
                ctx.textAlign = 'left';
              }
              break;
          }
          
          // Show field labels in edit mode for sub-fields
          if (!showPreviewMode) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Palatino, "Palatino Linotype", serif';
            ctx.fillText(subField.label, subField.coordinates.x + 2, subField.coordinates.y - 2);
          }
        });
      }
      return; // Exit early for group fields
    }

    // Original check for non-group fields
    if (!field.coordinates) return;

    ctx.fillStyle = '#000000';
    ctx.font = getFontString(field);
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        const value = getFieldValue(field, fields, previewValues);
        ctx.fillStyle = field.style?.color || '#000000';
        ctx.font = getFontString(field);
        ctx.fillText(value, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'date':
        const dateValue = previewValues[field.id] ? new Date(previewValues[field.id]).toLocaleDateString() : '';
        ctx.fillStyle = field.style?.color || '#000000';
        ctx.font = getFontString(field);
        ctx.fillText(dateValue, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'select':
        const selectValue = previewValues[field.id] || '';
        ctx.fillStyle = field.style?.color || '#000000';
        ctx.font = getFontString(field);
        ctx.fillText(selectValue, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'checkbox':
        const isChecked = previewValues[field.id];
        ctx.fillStyle = field.style?.color || '#000000';
        
        ctx.strokeStyle = field.style?.color || '#000000';
        ctx.lineWidth = 1;
        const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), field.coordinates.height - 4);
        const x = field.coordinates.x + 2;
        const y = field.coordinates.y + (field.coordinates.height / 2) - (boxSize / 2);
        
        ctx.strokeRect(x, y, boxSize, boxSize);
        
        if (isChecked) {
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
        ctx.font = getFontString(field);
        
        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines = [];
          let currentLine = words[0] || '';

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
          if (currentLine) lines.push(currentLine);
          return lines;
        };

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

      case 'table':
        if (!field.tableConfig) break;
        
        const baseCellHeight = 25;
        let hasContent = false;
        let lastContentY = field.coordinates.y;
        
        // Calculate total width from columns to determine if we need to scale
        const totalConfigWidth = field.tableConfig.columns.reduce((sum, col) => sum + (col.width || 0), 0);
        const availableWidth = field.coordinates.width;
        const widthScale = totalConfigWidth > 0 ? availableWidth / totalConfigWidth : 1;
        
        // First pass: calculate row heights based on content
        const rowHeights = [];
        for (let row = 0; row < field.tableConfig.rows; row++) {
          let maxRowHeight = baseCellHeight;
          
          field.tableConfig.columns.forEach((col, colIndex) => {
            const cellValue = previewValues[`${field.id}_${row}_${colIndex}`] || '';
            if (cellValue) {
              hasContent = true;
              const colWidth = col.width ? col.width * widthScale : availableWidth / field.tableConfig.columns.length;
              
              // Calculate required height for text wrapping
              ctx.font = getFontString(field, field.style?.fontSize || '11');
              const words = String(cellValue).split(' ');
              const lines = [];
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const textWidth = ctx.measureText(testLine).width;
                
                if (textWidth > colWidth - 10 && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              const requiredHeight = Math.max(baseCellHeight, lines.length * 16 + 10);
              maxRowHeight = Math.max(maxRowHeight, requiredHeight);
            }
          });
          
          rowHeights.push(maxRowHeight);
        }
        
        // Find last row with content
        let lastContentRow = -1;
        for (let row = 0; row < field.tableConfig.rows; row++) {
          for (let colIndex = 0; colIndex < field.tableConfig.columns.length; colIndex++) {
            const cellValue = previewValues[`${field.id}_${row}_${colIndex}`] || '';
            if (cellValue) {
              lastContentRow = Math.max(lastContentRow, row);
            }
          }
        }
        
        const effectiveRows = Math.max(lastContentRow + 1, 1);
        
        // Calculate cumulative heights
        let cumulativeHeight = 0;
        const rowYPositions = [];
        for (let i = 0; i <= effectiveRows; i++) {
          rowYPositions.push(cumulativeHeight);
          if (i < effectiveRows) {
            cumulativeHeight += rowHeights[i];
          }
        }
        
        // Check if we need to add "nothing follows" row
        let nothingFollowsRowHeight = 0;
        if (hasContent && lastContentRow < field.tableConfig.rows - 1) {
          nothingFollowsRowHeight = baseCellHeight;
        }
        
        const totalContentHeight = cumulativeHeight + nothingFollowsRowHeight;
        const maxAllowedHeight = field.coordinates.height;
        
        // Adjust if content exceeds field height
        let visibleRows = effectiveRows;
        let showNothingFollows = hasContent && lastContentRow < field.tableConfig.rows - 1;
        
        if (totalContentHeight > maxAllowedHeight) {
          // Find how many rows fit
          let currentHeight = 0;
          for (let i = 0; i < effectiveRows; i++) {
            if (currentHeight + rowHeights[i] + (showNothingFollows ? nothingFollowsRowHeight : 0) > maxAllowedHeight) {
              visibleRows = i;
              showNothingFollows = false; // Hide if no space
              break;
            }
            currentHeight += rowHeights[i];
          }
        }
        
        // Draw table content
        let currentX = field.coordinates.x;
        field.tableConfig.columns.forEach((col, colIndex) => {
          const colWidth = col.width ? col.width * widthScale : availableWidth / field.tableConfig.columns.length;
          
          for (let row = 0; row < visibleRows; row++) {
            let cellValue = previewValues[`${field.id}_${row}_${colIndex}`] || '';
            
            // Check if this column has a formula
            if (col.formula && col.formula.trim()) {
              console.log(`Evaluating table cell formula for ${field.id}_${row}_${colIndex}:`, col.formula);
              const formulaResult = evaluateFormula(col.formula, fields, previewValues, new Set<string>(), row, field);
              cellValue = formulaResult.toString();
              console.log(`Table cell formula result: ${formulaResult}`);
            }
            
            if (cellValue) {
              ctx.fillStyle = field.style?.color || '#000000';
              ctx.font = getFontString(field, field.style?.fontSize || '11');
              
              // Text wrapping for cell content
              const words = String(cellValue).split(' ');
              const lines = [];
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const textWidth = ctx.measureText(testLine).width;
                
                if (textWidth > colWidth - 10 && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              // Draw wrapped text
              const cellY = field.coordinates.y + rowYPositions[row];
              lines.forEach((line, lineIndex) => {
                ctx.fillText(
                  line,
                  currentX + 5,
                  cellY + 16 + (lineIndex * 16)
                );
              });
              
              lastContentY = Math.max(lastContentY, cellY + rowHeights[row]);
            }
          }
          currentX += colWidth;
        });
        
        // Draw "nothing follows" row if there's space
        if (showNothingFollows) {
          const nothingFollowsY = field.coordinates.y + rowYPositions[visibleRows];
          ctx.font = getFontString(field, '11');
          ctx.fillStyle = '#666666';
          ctx.textAlign = 'center';
          
          ctx.fillText(
            'xxx nothing follows xxx',
            field.coordinates.x + (field.coordinates.width / 2),
            nothingFollowsY + (nothingFollowsRowHeight / 2)
          );
          
          lastContentY = nothingFollowsY + nothingFollowsRowHeight;
        }
        
        // Draw grid lines
        const drawGridLines = () => {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.5;
          ctx.setLineDash([1, 2]); // Changed to dotted lines to match PDF generator
          
          // Calculate total visible height
          const totalVisibleHeight = showNothingFollows ? 
            rowYPositions[visibleRows] + nothingFollowsRowHeight : 
            rowYPositions[visibleRows];
          
          // Vertical lines (skip outer borders)
          currentX = field.coordinates.x;
          for (let colIndex = 0; colIndex < field.tableConfig.columns.length - 1; colIndex++) {
            const colWidth = field.tableConfig.columns[colIndex].width ? 
              field.tableConfig.columns[colIndex].width * widthScale : 
              availableWidth / field.tableConfig.columns.length;
            currentX += colWidth;
            
            ctx.beginPath();
            ctx.moveTo(currentX, field.coordinates.y);
            ctx.lineTo(currentX, field.coordinates.y + totalVisibleHeight);
            ctx.stroke();
          }
          
          // Horizontal lines (skip top border)
          for (let i = 1; i <= visibleRows; i++) {
            ctx.beginPath();
            ctx.moveTo(field.coordinates.x, field.coordinates.y + rowYPositions[i]);
            ctx.lineTo(field.coordinates.x + field.coordinates.width, field.coordinates.y + rowYPositions[i]);
            ctx.stroke();
          }
          
          // Line above "nothing follows" if shown
          if (showNothingFollows) {
            ctx.beginPath();
            ctx.moveTo(field.coordinates.x, field.coordinates.y + rowYPositions[visibleRows] + nothingFollowsRowHeight);
            ctx.lineTo(field.coordinates.x + field.coordinates.width, field.coordinates.y + rowYPositions[visibleRows] + nothingFollowsRowHeight);
            ctx.stroke();
          }
          
          ctx.setLineDash([]);
        };
        
        if (!showPreviewMode || true) { // Always show grid in preview
          drawGridLines();
        }
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        break;

      case 'image':
        const imageData = previewValues[field.id];
        if (imageData) {
          const img = new Image();
          img.src = imageData;
          img.onload = () => {
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
          ctx.strokeStyle = '#CBD5E1';
          ctx.strokeRect(
            field.coordinates.x,
            field.coordinates.y,
            field.coordinates.width,
            field.coordinates.height
          );
          ctx.fillStyle = '#94A3B8';
          ctx.font = getFontString(field);
          ctx.textAlign = 'center';
          ctx.fillText(
            'No image uploaded',
            field.coordinates.x + field.coordinates.width / 2,
            field.coordinates.y + field.coordinates.height / 2
          );
          ctx.textAlign = 'left';
        }
        break;

      case 'group':
        // Group fields show a container outline and render sub-fields
        if (!showPreviewMode) {
          ctx.strokeStyle = '#9333ea';
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
          ctx.setLineDash([]);
          
          ctx.fillStyle = '#9333ea';
          ctx.font = 'bold 12px Palatino, "Palatino Linotype", serif';
          ctx.fillText(`GROUP: ${field.label}`, field.coordinates.x + 5, field.coordinates.y - 5);
        }
        
        // Render sub-fields
        if (field.groupConfig?.fields) {
          const groupData = previewValues[field.id] || {};
          
          field.groupConfig.fields.forEach(subField => {
            if (!subField.coordinates) return;
            
            const subValue = groupData[subField.id];
            ctx.fillStyle = subField.style?.color || '#000000';
            ctx.font = getFontString(subField);
            
            switch (subField.type) {
              case 'text':
              case 'email':
              case 'number':
                const subFieldValue = getFieldValue(subField, fields, { ...previewValues, ...groupData });
                if (subFieldValue) {
                  ctx.fillText(subFieldValue, subField.coordinates.x + 5, subField.coordinates.y + (subField.coordinates.height / 2) + 5);
                }
                break;
                
              case 'checkbox':
                const subIsChecked = subValue;
                ctx.strokeStyle = subField.style?.color || '#000000';
                ctx.lineWidth = 1;
                const subBoxSize = Math.min(parseInt(subField.style?.fontSize || '12'), subField.coordinates.height - 4);
                const subX = subField.coordinates.x + 2;
                const subY = subField.coordinates.y + (subField.coordinates.height / 2) - (subBoxSize / 2);
                
                ctx.strokeRect(subX, subY, subBoxSize, subBoxSize);
                
                if (subIsChecked) {
                  ctx.fillStyle = subField.style?.color || '#000000';
                  ctx.fillRect(subX + 1, subY + 1, subBoxSize - 2, subBoxSize - 2);
                }
                break;
                
              case 'textarea':
                if (subValue) {
                  const subFontSize = parseInt(subField.style?.fontSize || '12');
                  const subLineHeight = subFontSize + 4;
                  const subMaxLines = Math.floor(subField.coordinates.height / subLineHeight);
                  
                  const subWrapText = (text: string, maxWidth: number) => {
                    const words = text.split(' ');
                    const lines = [];
                    let currentLine = words[0] || '';

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
                    if (currentLine) lines.push(currentLine);
                    return lines;
                  };

                  const subParagraphs = subValue.split('\n');
                  let currentY = subField.coordinates.y + subLineHeight;
                  let lineCount = 0;

                  for (const paragraph of subParagraphs) {
                    if (lineCount >= subMaxLines) break;
                    
                    const wrappedLines = subWrapText(paragraph, subField.coordinates.width);
                    for (const line of wrappedLines) {
                      if (lineCount >= subMaxLines) break;
                      
                      ctx.fillText(
                        line,
                        subField.coordinates.x + 5,
                        currentY
                      );
                      
                      currentY += subLineHeight;
                      lineCount++;
                    }
                  }
                }
                break;
            }
            
            // Show field labels in edit mode
            if (!showPreviewMode) {
              ctx.fillStyle = '#6b7280';
              ctx.font = '10px Palatino, "Palatino Linotype", serif';
              ctx.fillText(subField.label, subField.coordinates.x + 2, subField.coordinates.y - 2);
            }
          });
        }
        break;
    }
  };

  return (
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
          
          {/* Field Legend */}
          <div className="mt-4 text-sm">
            <div className="font-medium text-gray-700 mb-2">Field Legend:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(getFieldColor('text')).length > 0 && (
                <>
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
                </>
              )}
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
  );
};