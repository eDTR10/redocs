import React, { createContext, useContext, useState } from 'react';

interface DocumentTypeContextProps {
    documentType: string;
    setDocumentType: (type: string) => void;
}

const DocumentTypeContext = createContext<DocumentTypeContextProps | undefined>(undefined);

export const DocumentTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [documentType, setDocumentType] = useState('');
    return (
        <DocumentTypeContext.Provider value={{ documentType, setDocumentType }}>
            {children}
        </DocumentTypeContext.Provider>
    );
};

export const useDocumentType = () => {
    const context = useContext(DocumentTypeContext);
    if (!context) throw new Error('useDocumentType must be used within a DocumentTypeProvider');
    return context;
};
