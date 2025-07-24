import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
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
  };
  style?: {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
  };
}

// Helper function to generate ID from label
function generateIdFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Helper function to get PDF font based on fontFamily, fontWeight, and fontStyle
function getPDFFont(pdfDoc: PDFDocument, fontFamily: string, fontWeight: string, fontStyle: string) {
  // Map font families to PDF-lib standard fonts
  const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';
  const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 600;
  
  // For Palatino and other serif fonts, use Times Roman as fallback
  if (fontFamily.includes('Palatino') || fontFamily.includes('Times') || fontFamily.includes('Georgia')) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    if (isBold) return pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    return pdfDoc.embedFont(StandardFonts.TimesRoman);
  }
  
  // For Courier/monospace fonts
  if (fontFamily.includes('Courier')) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
    if (isBold) return pdfDoc.embedFont(StandardFonts.CourierBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.CourierOblique);
    return pdfDoc.embedFont(StandardFonts.Courier);
  }
  
  // For all other fonts (Arial, Helvetica, Calibri, etc.), use Helvetica
  if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (isBold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
  if (isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  return pdfDoc.embedFont(StandardFonts.Helvetica);
}

export async function generatePDFWithFields(
  pdfUrl: string,
  fields: Field[],
  values: Record<string, any>
): Promise<PDFDocument> {
  console.log('PDF Generation - All field values:', values);
  console.log('PDF Generation - Field types:', fields.map(f => ({ id: f.id, type: f.type })));
  
  // PDF preview is rendered at this scale in the viewer
  const PREVIEW_SCALE = 1.5;
  
  const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  const pages = pdfDoc.getPages();
  
  // Replace forEach with for...of to properly handle async operations
  for (const field of fields) {
    if (!field.coordinates) continue;
    
    const page = pages[field.page - 1];
    if (!page) continue;
    
    // Get canvas coordinates
    const { x: canvasX, y: canvasY, width: canvasWidth, height: canvasHeight } = field.coordinates;
    
    // Convert from canvas coordinates (scaled) to PDF coordinates
    // PDF coordinates start from bottom-left, canvas from top-left
    const pdfX = canvasX / PREVIEW_SCALE;
    const pdfY = page.getHeight() - ((canvasY / PREVIEW_SCALE) + (canvasHeight / PREVIEW_SCALE));
    const pdfWidth = canvasWidth / PREVIEW_SCALE;
    const pdfHeight = canvasHeight / PREVIEW_SCALE;
    
    // Get field value
    const value = values[field.id];
    
    // Get style properties with defaults matching FieldManager
    const fontSize = (parseInt(field.style?.fontSize  || '12') / PREVIEW_SCALE   )+1.5;
    const color = field.style?.color ? parseColor(field.style.color) : rgb(0, 0, 0);
    const fontFamily = field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif';
    const fontWeight = field.style?.fontWeight || 'normal';
    const fontStyle = field.style?.fontStyle || 'normal';
    
    // Get the appropriate PDF font
    const font = await getPDFFont(pdfDoc, fontFamily, fontWeight, fontStyle);
    
    try {
      switch (field.type) {
        case 'text':
        case 'number':
        case 'email':
        case 'date':
        case 'select':
          if (value !== undefined && value !== '') {
            page.drawText(String(value || ''), {
              x: pdfX + 2,
              y: pdfY + (pdfHeight / 2) - (fontSize / 2),
              size: fontSize,
              color,
              font,
            });
          }
          break;
          
        case 'checkbox':
          console.log(`Processing checkbox ${field.id} with value:`, value, typeof value);
          
          // Use the same sizing logic as the preview
          const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), pdfHeight - 4) / PREVIEW_SCALE;
          const checkboxX = pdfX + 2;
          const checkboxY = pdfY + (pdfHeight / 2) - (boxSize / 2);
          
          // Draw checkbox border
          page.drawRectangle({
            x: checkboxX,
            y: checkboxY,
            width: boxSize,
            height: boxSize,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
            color: rgb(1, 1, 1), // White background
          });
          
          // Check if the checkbox is checked
          const isChecked = value === true || value === 'true' || value === 1 || value === '1' || value === 'on' || value === 'yes';
          if (isChecked) {
            console.log(`Drawing filled checkbox for ${field.id}`);
            
            // Fill the checkbox with a solid color (like the preview)
            page.drawRectangle({
              x: checkboxX + 1,
              y: checkboxY + 1,
              width: boxSize - 2,
              height: boxSize - 2,
              color: color, // Use the field's color
            });
          }
          break;

        case 'textarea':
          if (value) {
            const text = String(value);
            const lineHeight = fontSize * 1.2;
            
            // Better text wrapping - match PDFViewer logic exactly
            const lines = [];
            const paragraphs = text.split('\n');
            
            for (const paragraph of paragraphs) {
              if (!paragraph.trim()) {
                lines.push('');
                continue;
              }
              
              const words = paragraph.split(/\s+/);
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                // Use the same character width calculation as PDFViewer (fontSize * 0.6)
                const testWidth = testLine.length * fontSize * 0.6;
                
                // Use pdfWidth * PREVIEW_SCALE to match canvas calculations, then subtract padding
                if (testWidth > (pdfWidth * PREVIEW_SCALE) - 10 && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              
              if (currentLine) {
                lines.push(currentLine);
              }
            }
            
            // Draw the wrapped text - match PDFViewer positioning
            const maxLines = Math.floor((pdfHeight * PREVIEW_SCALE) / (lineHeight * PREVIEW_SCALE));
            lines.slice(0, maxLines).forEach((line, index) => {
              page.drawText(line, {
                x: pdfX + 4,
                y: pdfY + pdfHeight - ((lineHeight * (index + 1)) / PREVIEW_SCALE),
                size: fontSize,
                color,
                font,
              });
            });
          }
          break;

        case 'table':
          if (field.tableConfig) {
            console.log(`Processing table ${field.id}`, field.tableConfig);
            
            // Calculate column widths based on config (matching PDFViewer logic)
            const totalConfigWidth = field.tableConfig.columns.reduce((sum, col) => sum + (col.width || 0), 0);
            const availableWidth = pdfWidth * PREVIEW_SCALE; // Scale back to canvas units for calculations
            const widthScale = totalConfigWidth > 0 ? availableWidth / totalConfigWidth : 1;
            
            const baseCellHeight = 25; // Keep in canvas units initially
            
            // Use the field's actual font size for table text (matching canvas)
            const tableFontSize = parseInt(field.style?.fontSize || '11');
            
            // Calculate row heights based on content (matching PDFViewer logic)
            const rowHeights = [];
            let hasContent = false;
            let lastContentRow = -1;
            
            for (let row = 0; row < field.tableConfig.rows; row++) {
              let maxRowHeight = baseCellHeight;
              
              field.tableConfig.columns.forEach((col, colIndex) => {
                const cellValue = values[`${field.id}_${row}_${colIndex}`] || '';
                if (cellValue) {
                  hasContent = true;
                  lastContentRow = Math.max(lastContentRow, row);
                  
                  const colWidth = col.width ? col.width * widthScale : availableWidth / field.tableConfig.columns.length;
                  
                  // Calculate required height for text wrapping (matching PDFViewer)
                  const words = String(cellValue).split(' ');
                  const lines = [];
                  let currentLine = '';
                  
                  // Use tableFontSize directly to match canvas rendering
                  const avgCharWidth = tableFontSize * 0.6;
                  
                  for (const word of words) {
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    const textWidth = testLine.length * avgCharWidth;
                    
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
            
            const effectiveRows = Math.max(lastContentRow + 1, 1);
            
            // Calculate cumulative heights (matching PDFViewer)
            let cumulativeHeight = 0;
            const rowYPositions = [];
            for (let i = 0; i <= effectiveRows; i++) {
              rowYPositions.push(cumulativeHeight);
              if (i < effectiveRows) {
                cumulativeHeight += rowHeights[i];
              }
            }
            
            // Check if we need "nothing follows" row
            let nothingFollowsRowHeight = 0;
            if (hasContent && lastContentRow < field.tableConfig.rows - 1) {
              nothingFollowsRowHeight = baseCellHeight;
            }
            
            const totalContentHeight = cumulativeHeight + nothingFollowsRowHeight;
            const maxAllowedHeight = pdfHeight * PREVIEW_SCALE; // Scale back to canvas units
            
            // Adjust if content exceeds field height
            let visibleRows = effectiveRows;
            let showNothingFollows = hasContent && lastContentRow < field.tableConfig.rows - 1;
            
            if (totalContentHeight > maxAllowedHeight) {
              let currentHeight = 0;
              for (let i = 0; i < effectiveRows; i++) {
                if (currentHeight + rowHeights[i] + (showNothingFollows ? nothingFollowsRowHeight : 0) > maxAllowedHeight) {
                  visibleRows = i;
                  showNothingFollows = false;
                  break;
                }
                currentHeight += rowHeights[i];
              }
            }
            
            // Convert measurements to PDF units for drawing
            const pdfRowHeights = rowHeights.map(h => h / PREVIEW_SCALE);
            const pdfRowYPositions = rowYPositions.map(pos => pos / PREVIEW_SCALE);
            const pdfNothingFollowsHeight = nothingFollowsRowHeight / PREVIEW_SCALE;
            
            // Draw horizontal lines (skip top border)
            for (let i = 1; i <= visibleRows; i++) {
              page.drawLine({
                start: { x: pdfX, y: pdfY + pdfHeight - pdfRowYPositions[i] },
                end: { x: pdfX + pdfWidth, y: pdfY + pdfHeight - pdfRowYPositions[i] },
                color: rgb(0, 0, 0),
                thickness: 0.3,
                dashArray: [1, 2],
              });
            }
            
            // Line above "nothing follows" if shown
            if (showNothingFollows) {
              page.drawLine({
                start: { x: pdfX, y: pdfY + pdfHeight - (pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight) },
                end: { x: pdfX + pdfWidth, y: pdfY + pdfHeight - (pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight) },
                color: rgb(0, 0, 0),
                thickness: 0.3,
                dashArray: [1, 2],
              });
            }
            
            // Draw vertical lines (skip outer borders)
            let currentX = pdfX;
            for (let colIndex = 0; colIndex < field.tableConfig.columns.length - 1; colIndex++) {
              const colWidth = field.tableConfig.columns[colIndex].width ? 
                (field.tableConfig.columns[colIndex].width * widthScale) / PREVIEW_SCALE : 
                pdfWidth / field.tableConfig.columns.length;
              currentX += colWidth;
              
              const totalVisibleHeight = showNothingFollows ? 
                pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight : 
                pdfRowYPositions[visibleRows];
              
              page.drawLine({
                start: { x: currentX, y: pdfY + pdfHeight - totalVisibleHeight },
                end: { x: currentX, y: pdfY + pdfHeight },
                color: rgb(0, 0, 0),
                thickness: 0.3,
                opacity: 0.5,
                dashArray: [1, 2],
              });
            }
            
            // Fill table with data
            currentX = pdfX;
            for (let colIndex = 0; colIndex < field.tableConfig.columns.length; colIndex++) {
              const colWidth = field.tableConfig.columns[colIndex].width ? 
                (field.tableConfig.columns[colIndex].width * widthScale) / PREVIEW_SCALE : 
                pdfWidth / field.tableConfig.columns.length;
              
              for (let row = 0; row < visibleRows; row++) {
                const cellValue = values[`${field.id}_${row}_${colIndex}`] || '';
                
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                  const cellX = currentX + 5 / PREVIEW_SCALE;
                  const cellY = pdfY + pdfHeight - pdfRowYPositions[row] - (16 / PREVIEW_SCALE);
                  
                  // Text wrapping for PDF (matching PDFViewer logic)
                  const text = String(cellValue);
                  const canvasColWidth = field.tableConfig.columns[colIndex].width ? 
                    field.tableConfig.columns[colIndex].width * widthScale : 
                    availableWidth / field.tableConfig.columns.length;
                  
                  const words = text.split(' ');
                  const lines = [];
                  let currentLine = '';
                  
                  // Use tableFontSize directly to match canvas
                  const avgCharWidth = tableFontSize * 0.6;
                  
                  for (const word of words) {
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    const textWidth = testLine.length * avgCharWidth;
                    
                    if (textWidth > canvasColWidth - 10 && currentLine) {
                      lines.push(currentLine);
                      currentLine = word;
                    } else {
                      currentLine = testLine;
                    }
                  }
                  if (currentLine) lines.push(currentLine);
                  
                  // Draw wrapped text with proper spacing
                  lines.forEach((line, lineIndex) => {
                    const lineY = cellY - (lineIndex * (16 / PREVIEW_SCALE));
                    page.drawText(line, {
                      x: cellX,
                      y: lineY,
                      size: tableFontSize / PREVIEW_SCALE, // Use actual font size scaled down
                      color,
                      font,
                    });
                  });
                }
              }
              
              currentX += colWidth;
            }
            
            // Draw "nothing follows" text in its own row (matching PDFViewer)
            if (showNothingFollows) {
              const nothingFollowsY = pdfY + pdfHeight - pdfRowYPositions[visibleRows] - (pdfNothingFollowsHeight / 2);
              
              // Calculate text width for proper centering
              const nothingFollowsText = 'xxx nothing follows xxx';
              const textSize = (tableFontSize * 0.8) / PREVIEW_SCALE; // Scale the "nothing follows" text too
              const estimatedTextWidth = nothingFollowsText.length * textSize * 0.6;
              
              page.drawText(nothingFollowsText, {
                x: pdfX + (pdfWidth / 2) - (estimatedTextWidth / 2),
                y: nothingFollowsY,
                size: textSize,
                color: rgb(0, 0, 0),
                opacity: 0.5,
                font: await getPDFFont(pdfDoc, fontFamily, 'normal', 'normal'),
              });
            }
          }
          break;
          
        case 'image':
          if (value) {
            try {
              console.log(`Processing image field ${field.id} with value:`, value);
              
              let imageBytes;
              let image;
              
              // Handle different image sources
              if (value.startsWith('data:')) {
                // Handle base64 data URLs
                const base64Data = value.split(',')[1];
                imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
              } else if (value.startsWith('blob:')) {
                // Handle blob URLs
                const response = await fetch(value);
                imageBytes = await response.arrayBuffer();
              } else {
                // Handle regular URLs
                const response = await fetch(value, {
                  mode: 'cors',
                  credentials: 'same-origin'
                });
                
                if (!response.ok) {
                  throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                }
                
                imageBytes = await response.arrayBuffer();
              }
              
              console.log(`Image data loaded, size: ${imageBytes.byteLength} bytes`);
              
              // Determine image type and embed
              if (value.includes('data:image/png') || value.toLowerCase().includes('.png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else if (value.includes('data:image/jpeg') || value.includes('data:image/jpg') || 
                         value.toLowerCase().includes('.jpg') || value.toLowerCase().includes('.jpeg')) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                // Try PNG first, then JPG
                try {
                  image = await pdfDoc.embedPng(imageBytes);
                } catch {
                  image = await pdfDoc.embedJpg(imageBytes);
                }
              }
              
              // Calculate dimensions to fit within the field while maintaining aspect ratio
              const imgDims = image.scale(1);
              const scaleX = (pdfWidth - 8) / imgDims.width;
              const scaleY = (pdfHeight - 8) / imgDims.height;
              const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
              
              const scaledWidth = imgDims.width * scale;
              const scaledHeight = imgDims.height * scale;
              
              // Center the image in the field
              const imgX = pdfX + (pdfWidth - scaledWidth) / 2;
              const imgY = pdfY + (pdfHeight - scaledHeight) / 2;
              
              page.drawImage(image, {
                x: imgX,
                y: imgY,
                width: scaledWidth,
                height: scaledHeight,
              });
              
              console.log(`Image successfully embedded at x:${imgX}, y:${imgY}, w:${scaledWidth}, h:${scaledHeight}`);
              
            } catch (error) {
              console.error(`Error embedding image for field ${field.id}:`, error);
              
              // Draw error placeholder
              page.drawRectangle({
                x: pdfX + 2,
                y: pdfY + 2,
                width: pdfWidth - 4,
                height: pdfHeight - 4,
                borderColor: rgb(1, 0, 0),
                borderWidth: 1,
              });
              
              page.drawText('Image Error', {
                x: pdfX + 4,
                y: pdfY + pdfHeight / 2,
                size: Math.min(fontSize, 8),
                color: rgb(1, 0, 0),
                font,
              });
            }
          }
          break;

        case 'group':
          // Group fields don't render directly on PDF, but their sub-fields do
          if (field.groupConfig?.fields) {
            for (const subField of field.groupConfig.fields) {
              if (!subField.coordinates) continue;
              
              // Process sub-field values from the group structure
              const groupData = values[field.id] || {};
              const subFieldValue = groupData[subField.id];
              
              // Use the same rendering logic as other field types
              if (subFieldValue !== undefined && subFieldValue !== '') {
                const subPdfX = subField.coordinates.x / PREVIEW_SCALE;
                const subPdfY = page.getHeight() - ((subField.coordinates.y / PREVIEW_SCALE) + (subField.coordinates.height / PREVIEW_SCALE));
                const subPdfWidth = subField.coordinates.width / PREVIEW_SCALE;
                const subPdfHeight = subField.coordinates.height / PREVIEW_SCALE;
                
                const subFontSize = (parseInt(subField.style?.fontSize || '12') / PREVIEW_SCALE) + 1.5;
                const subColor = subField.style?.color ? parseColor(subField.style.color) : rgb(0, 0, 0);
                const subFontFamily = subField.style?.fontFamily || 'Palatino, "Palatino Linotype", serif';
                const subFontWeight = subField.style?.fontWeight || 'normal';
                const subFontStyle = subField.style?.fontStyle || 'normal';
                const subFont = await getPDFFont(pdfDoc, subFontFamily, subFontWeight, subFontStyle);
                
                // Render based on sub-field type
                switch (subField.type) {
                  case 'text':
                  case 'number':
                  case 'email':
                  case 'date':
                  case 'select':
                    page.drawText(String(subFieldValue || ''), {
                      x: subPdfX + 2,
                      y: subPdfY + (subPdfHeight / 2) - (subFontSize / 2),
                      size: subFontSize,
                      color: subColor,
                      font: subFont,
                    });
                    break;
                    
                  case 'checkbox':
                    const subBoxSize = Math.min(parseInt(subField.style?.fontSize || '12'), subPdfHeight - 4) / PREVIEW_SCALE;
                    const subCheckboxX = subPdfX + 2;
                    const subCheckboxY = subPdfY + (subPdfHeight / 2) - (subBoxSize / 2);
                    
                    page.drawRectangle({
                      x: subCheckboxX,
                      y: subCheckboxY,
                      width: subBoxSize,
                      height: subBoxSize,
                      borderColor: rgb(0, 0, 0),
                      borderWidth: 1,
                      color: rgb(1, 1, 1),
                    });
                    
                    const subIsChecked = subFieldValue === true || subFieldValue === 'true' || subFieldValue === 1 || subFieldValue === '1' || subFieldValue === 'on' || subFieldValue === 'yes';
                    if (subIsChecked) {
                      page.drawRectangle({
                        x: subCheckboxX + 1,
                        y: subCheckboxY + 1,
                        width: subBoxSize - 2,
                        height: subBoxSize - 2,
                        color: subColor,
                      });
                    }
                    break;
                    
                  case 'textarea':
                    if (subFieldValue) {
                      const subText = String(subFieldValue);
                      const subLineHeight = subFontSize * 1.2;
                      
                      const subLines = [];
                      const subParagraphs = subText.split('\n');
                      
                      for (const paragraph of subParagraphs) {
                        if (!paragraph.trim()) {
                          subLines.push('');
                          continue;
                        }
                        
                        const words = paragraph.split(/\s+/);
                        let currentLine = '';
                        
                        for (const word of words) {
                          const testLine = currentLine + (currentLine ? ' ' : '') + word;
                          const testWidth = testLine.length * subFontSize * 0.6;
                          
                          if (testWidth > (subPdfWidth * PREVIEW_SCALE) - 10 && currentLine) {
                            subLines.push(currentLine);
                            currentLine = word;
                          } else {
                            currentLine = testLine;
                          }
                        }
                        
                        if (currentLine) {
                          subLines.push(currentLine);
                        }
                      }
                      
                      const subMaxLines = Math.floor((subPdfHeight * PREVIEW_SCALE) / (subLineHeight * PREVIEW_SCALE));
                      subLines.slice(0, subMaxLines).forEach((line, index) => {
                        page.drawText(line, {
                          x: subPdfX + 4,
                          y: subPdfY + subPdfHeight - ((subLineHeight * (index + 1)) / PREVIEW_SCALE),
                          size: subFontSize,
                          color: subColor,
                          font: subFont,
                        });
                      });
                    }
                    break;
                }
              }
            }
          }
          break;
      }
    } catch (error) {
      console.warn(`Failed to render field ${field.id}:`, error);
    }
  }
  
  return pdfDoc;
}

function parseColor(colorString: string) {
  if (colorString.startsWith('#')) {
    const hex = colorString.slice(1);
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0, 0, 0);
}