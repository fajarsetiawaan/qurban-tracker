import { useState, useEffect } from 'react';
import { Delete, Check, X } from 'lucide-react';
import { formatNumber, unformatNumber } from '../lib/utils';

export default function CalculatorModal({ isOpen, onClose, onConfirm, initialValue, title = "Masukkan Jumlah" }) {
    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
        if (isOpen) {
            // Reset or set initial value when opening
            // If initialValue is provided, use it, otherwise '0'
            const val = initialValue ? unformatNumber(initialValue).toString() : '0';
            setDisplayValue(val === '0' ? '0' : formatNumber(val));
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleNumberClick = (num) => {
        let currentRaw = unformatNumber(displayValue).toString();

        // Prevent multiple leading zeros
        if (currentRaw === '0') currentRaw = '';

        const newValue = currentRaw + num;
        setDisplayValue(formatNumber(newValue));
    };

    const handleBackspace = () => {
        let currentRaw = unformatNumber(displayValue).toString();
        if (currentRaw.length <= 1) {
            setDisplayValue('0');
        } else {
            setDisplayValue(formatNumber(currentRaw.slice(0, -1)));
        }
    };

    const handleClear = () => {
        setDisplayValue('0');
    };

    const handleConfirm = () => {
        onConfirm(displayValue);
        onClose();
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up pb-safe"
            >
                {/* Header / Display */}
                <div className="bg-slate-50 p-6 pt-8 text-right border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                    <div className="flex items-center justify-end space-x-2 overflow-hidden">
                        <span className="text-3xl font-bold text-emerald-600">Rp</span>
                        <span className="text-5xl font-black text-slate-800 tracking-tight truncate">
                            {displayValue}
                        </span>
                    </div>
                </div>

                {/* Keypad */}
                <div className="p-5 grid grid-cols-4 gap-3 bg-white">
                    {/* Row 1 */}
                    <KeyButton onClick={() => handleNumberClick('7')}>7</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('8')}>8</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('9')}>9</KeyButton>
                    <ActionButton onClick={handleClear} className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100">
                        C
                    </ActionButton>

                    {/* Row 2 */}
                    <KeyButton onClick={() => handleNumberClick('4')}>4</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('5')}>5</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('6')}>6</KeyButton>
                    <ActionButton onClick={handleBackspace} className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100">
                        <Delete size={24} />
                    </ActionButton>

                    {/* Row 3 */}
                    <KeyButton onClick={() => handleNumberClick('1')}>1</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('2')}>2</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('3')}>3</KeyButton>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="row-span-2 bg-gradient-to-b from-emerald-500 to-emerald-600 active:from-emerald-600 active:to-emerald-700 transition-all rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-200 active:scale-95 active:shadow-none"
                    >
                        <Check size={32} strokeWidth={3} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Simpan</span>
                    </button>

                    {/* Row 4 */}
                    <KeyButton onClick={() => handleNumberClick('0')}>0</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('00')} className="text-xl tracking-tighter">00</KeyButton>
                    <KeyButton onClick={() => handleNumberClick('000')} className="text-lg tracking-tighter">000</KeyButton>
                </div>
            </div>
        </div>
    );
}

const KeyButton = ({ children, onClick, className = "" }) => (
    <button
        onClick={onClick}
        className={`h-[4.5rem] rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition flex items-center justify-center text-2xl font-bold text-slate-700 shadow-sm border border-slate-100/50 ${className}`}
    >
        {children}
    </button>
);

const ActionButton = ({ children, onClick, className = "" }) => (
    <button
        onClick={onClick}
        className={`h-[4.5rem] rounded-[1.5rem] active:scale-95 transition flex items-center justify-center font-bold shadow-sm ${className}`}
    >
        {children}
    </button>
);
