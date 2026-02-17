import { motion } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

const toastVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } },
};

const Toast = ({ message, type = 'info', onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center w-full max-w-sm p-4 text-slate-500 bg-white rounded-xl shadow-lg border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 pointer-events-auto"
            role="alert"
        >
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex items-center justify-center h-8 w-8 dark:text-slate-500 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={onClose}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export default Toast;
