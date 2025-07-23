import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export interface TrackingStepProps {
    step: {
        id: string;
        title: string;
        description: string;
        status: string;
        date?: string;
        assignedTo?: string;
    };
    isLast: boolean;
    getStepIcon?: (status: string) => JSX.Element;
    getStepColor?: (status: string) => string;
}

const defaultGetStepIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="w-6 h-6 text-green-500" />;
        case 'current':
            return <Clock className="w-6 h-6 text-blue-500" />;
        case 'rejected':
            return <XCircle className="w-6 h-6 text-red-500" />;
        default:
            return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
};

const defaultGetStepColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'border-green-500 bg-green-50';
        case 'current':
            return 'border-blue-500 bg-blue-50';
        case 'rejected':
            return 'border-red-500 bg-red-50';
        default:
            return 'border-gray-300 bg-gray-50';
    }
};

const TrackingStep: React.FC<TrackingStepProps> = ({ step, isLast, getStepIcon = defaultGetStepIcon, getStepColor = defaultGetStepColor }) => (
    <div className="relative">
        {/* Connector Line */}
        {!isLast && (
            <div className="absolute left-3 top-10 w-0.5 h-16 bg-gray-300"></div>
        )}
        <div className={`relative flex items-start p-4 rounded-lg border-2 ${getStepColor(step.status)}`}>
            <div className="flex-shrink-0 mr-4">
                {getStepIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                        {step.title}
                    </h4>
                    {step.date && (
                        <span className="text-xs text-gray-500">
                            {step.date}
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                </p>
                {step.assignedTo && (
                    <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">Assigned to:</span> {step.assignedTo}
                    </p>
                )}
            </div>
        </div>
    </div>
);

export default TrackingStep;
