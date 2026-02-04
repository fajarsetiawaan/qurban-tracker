import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react';

export default function DatePicker({ isOpen, onClose, selectedDate, onDateChange }) {
    if (!isOpen) return null;

    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
    const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate ? new Date(selectedDate) : new Date());

    // Sync state when prop changes
    useEffect(() => {
        if (selectedDate) {
            const date = new Date(selectedDate);
            setTempSelectedDate(date);
            // Only update current month if the selected date is widely different? 
            // Actually, usually user expects to see the selected date.
            setCurrentMonth(date);
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
        // 0 = Sunday, 1 = Monday, etc.
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Adjust for timezone offset to avoid "yesterday" bugs if just saving yyyy-mm-dd string
        // But here we are dealing with Date objects. 
        // Let's keep it simple.
        setTempSelectedDate(newDate);
    };

    const handleConfirm = () => {
        // Return YYYY-MM-DD string as expected by the parent form
        const offset = tempSelectedDate.getTimezoneOffset();
        const date = new Date(tempSelectedDate.getTime() - (offset * 60 * 1000));
        onDateChange(date.toISOString().split('T')[0]);
        onClose();
    };

    const handleReset = () => {
        const today = new Date();
        setTempSelectedDate(today);
        setCurrentMonth(today);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = tempSelectedDate.toDateString() === dateToCheck.toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition
                        ${isSelected
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 font-bold'
                            : 'text-slate-300 hover:bg-slate-700'}`}
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
        >
            <div
                className="bg-slate-800 w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-700 rounded-full text-slate-400">
                        <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-white font-bold text-lg">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-700 rounded-full text-slate-400">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-slate-500">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-2 justify-items-center mb-8">
                    {renderDays()}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-2">
                    <button
                        onClick={handleReset}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center space-x-2"
                    >
                        {/* <RotateCcw size={14} /> */}
                        <span>Reset</span>
                    </button>

                    <button
                        onClick={handleConfirm}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-12 w-12 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition active:scale-95"
                    >
                        <Check size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
