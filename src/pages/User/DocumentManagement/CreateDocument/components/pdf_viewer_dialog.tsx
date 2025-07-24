
import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { PDFViewer } from './forms/PDFViewer';


interface PDFViewerDialogProps {
    open: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    fields: any[];
    setFields: (fields: any[]) => void;
    currentField: any;
    setCurrentField: (field: any) => void;
    showFieldModal: boolean;
    setShowFieldModal: (show: boolean) => void;
    drawingMode: boolean;
    setDrawingMode: (drawing: boolean) => void;
    showPreviewMode: boolean;
    previewValues: any;
    setPreviewValues: (values: any) => void;
}


const PDFViewerDialog: React.FC<PDFViewerDialogProps> = ({
    open,
    onClose,
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
    setPreviewValues,
}) => {
    // Ensure Dialog's onOpenChange receives a boolean and only closes when false
    const handleDialogChange = (isOpen: boolean) => {
        if (!isOpen) onClose();
    };
    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                        <div className="flex-1 overflow-auto p-8">
                            <PDFViewer
                                pdfUrl={pdfUrl}
                                fields={fields}
                                setFields={setFields}
                                currentField={currentField}
                                setCurrentField={setCurrentField}
                                showFieldModal={showFieldModal}
                                setShowFieldModal={setShowFieldModal}
                                drawingMode={drawingMode}
                                setDrawingMode={setDrawingMode}
                                showPreviewMode={showPreviewMode}
                                previewValues={previewValues}
                                setPreviewValues={setPreviewValues}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
};

export default PDFViewerDialog;
