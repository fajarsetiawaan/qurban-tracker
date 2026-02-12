import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

/**
 * Safely parse a date value into a local Date object.
 * Handles YYYY-MM-DD strings by appending T00:00:00 to force local timezone parsing
 * instead of UTC (which causes off-by-one day issues in UTC+ timezones).
 * @param {string|Date} value - Date string or Date object
 * @returns {Date} Local Date object
 */
function parseLocalDate(value) {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    // If it's a YYYY-MM-DD string, append T00:00:00 to parse as local time
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value + 'T00:00:00');
    }
    return new Date(value);
}

/**
 * Format a Date object to a YYYY-MM-DD string using local timezone.
 * @param {Date} date
 * @returns {string}
 */
function toLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function DatePicker({ isOpen, onClose, selectedDate, onDateChange }) {
    if (!isOpen) return null;

    const [currentMonth, setCurrentMonth] = useState(parseLocalDate(selectedDate));
    const [tempSelectedDate, setTempSelectedDate] = useState(parseLocalDate(selectedDate));

    // Sync state when prop changes
    useEffect(() => {
        if (selectedDate) {
            const date = parseLocalDate(selectedDate);
            setTempSelectedDate(date);
            setCurrentMonth(date);
        } else {
            const now = new Date();
            setTempSelectedDate(now);
            setCurrentMonth(now);
        }
    }, [selectedDate, isOpen]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setTempSelectedDate(newDate);
    };

    const handleConfirm = () => {
        // Output a local YYYY-MM-DD string to avoid UTC timezone offset issues
        onDateChange(toLocalDateString(tempSelectedDate));
        onClose();
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = tempSelectedDate.toDateString() === dateToCheck.toDateString();
            const isToday = new Date().toDateString() === dateToCheck.toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200
                        ${isSelected
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                            : isToday
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'}`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-sm animate-scale-up"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handlePrevMonth}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <button
                        onClick={handleNextMonth}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div>
                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="h-10 flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-wide">
                                {d}
                            </div>
                        ))}
                    </div>
                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {renderDays()}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center space-x-2"
                    >
                        <X size={18} />
                        <span>Batal</span>
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 active:scale-95 duration-200"
                    >
                        <Check size={18} strokeWidth={3} />
                        <span>Pilih</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

