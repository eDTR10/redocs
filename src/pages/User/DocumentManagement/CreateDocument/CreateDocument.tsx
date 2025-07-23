import { useState } from 'react';
import { FileText, Save, Calendar, User, Plus, Trash2 } from 'lucide-react';
// TODO: Define PurchaseRequestItem type here if it doesn't exist in the Document interface file
type PurchaseRequestItem = {
    id: number;
    stockPropertyNo: string;
    unit: string;
    itemDescription: string;
    quantity: string;
    unitCost: string;
    totalCost: number;
};
// import { PurchaseRequestItem } from '../../../../interfaces/Document';
import DocumentManage from '@/pages/Admin/DocumentManage';

const CreateDocument = () => {
    // Form state
    const [division, setDivision] = useState('');
    const [office, setOffice] = useState('');
    const [chargeToSpecify, setChargeToSpecify] = useState(false);
    const [fundSource, setFundSource] = useState('');
    const [saroNo, setSaroNo] = useState('');
    const [date, setDate] = useState('');
    const [reference, setReference] = useState('');
    const [prNo, setPrNo] = useState('');
    const [purpose, setPurpose] = useState('');

    // Requested by fields
    const [requestedByName, setRequestedByName] = useState('');
    const [requestedByDesignation, setRequestedByDesignation] = useState('');

    // Approved by fields
    const [approvedByName, setApprovedByName] = useState('');
    const [approvedByDesignation, setApprovedByDesignation] = useState('');

    // Items list
    const [items, setItems] = useState<PurchaseRequestItem[]>([
        {
            id: 1,
            stockPropertyNo: '',
            unit: '',
            itemDescription: '',
            quantity: '',
            unitCost: '',
            totalCost: 0
        }
    ]);

    // Helper functions
    const addItem = () => {
        const newItem = {
            id: items.length + 1,
            stockPropertyNo: '',
            unit: '',
            itemDescription: '',
            quantity: '',
            unitCost: '',
            totalCost: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: number, field: string, value: string) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Calculate total cost when quantity or unit cost changes
                if (field === 'quantity' || field === 'unitCost') {
                    const quantity = parseFloat(field === 'quantity' ? value : updatedItem.quantity) || 0;
                    const unitCost = parseFloat(field === 'unitCost' ? value : updatedItem.unitCost) || 0;
                    updatedItem.totalCost = quantity * unitCost;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const calculateGrandTotal = () => {
        return items.reduce((total, item) => total + item.totalCost, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
       
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}



            <DocumentManage />

            {/* Recent Purchase Requests Table */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Purchase Requests</h2>
                    <span className="text-sm text-gray-500">Last 10 requests</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PR No.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Division
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Office
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-001
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Administrative Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Main Office
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱25,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 15, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Approved
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-002
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Technical Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Branch Office A
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱15,750.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 14, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Pending
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-003
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Finance Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Main Office
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱8,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 13, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Rejected
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CreateDocument;
