'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface DateTimePickerProps {
  initialDate?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
}

export default function DateTimePicker({ initialDate, isOpen, onClose, onSave }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [timeInput, setTimeInput] = useState<string>('09:00');
  const [showTimeList, setShowTimeList] = useState(false);
  
  const timeListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const date = initialDate ? new Date(initialDate) : new Date();
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setSelectedTime(timeStr);
      setTimeInput(timeStr);
    }
  }, [isOpen, initialDate]);

  // Calendar Logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
  };

  const generateCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = startDayOfMonth(currentMonth);
    
    // Previous month filler
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthDays - i) });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i) });
    }

    // Next month filler
    const remainingSlots = 42 - days.length; // 6 rows * 7 cols
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i) });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const newDate = new Date(date);
    // Preserve time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    newDate.setHours(hours || 0, minutes || 0);
    setSelectedDate(newDate);
    
    // If clicked date is not in current month view, switch view
    if (date.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  // Time Logic
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = i.toString().padStart(2, '0');
        const minute = j.toString().padStart(2, '0');
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeInput(time);
    setShowTimeList(false);
    
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes);
    setSelectedDate(newDate);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTimeInput(val);
    
    // Validate format HH:mm
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
        setSelectedTime(val);
        const [hours, minutes] = val.split(':').map(Number);
        const newDate = new Date(selectedDate);
        newDate.setHours(hours, minutes);
        setSelectedDate(newDate);
    }
  };

  const handleSave = () => {
    onSave(selectedDate.toISOString());
    onClose();
  };

  if (!isOpen) return null;

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header with Month/Year */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 capitalize">
            {monthNames[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-1">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-xs font-bold text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {generateCalendarDays().map((item, idx) => {
              const isSelected = item.date.toDateString() === selectedDate.toDateString();
              const isToday = item.date.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(item.date)}
                  className={`
                    h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all
                    ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold' : ''}
                    ${!isSelected && isToday ? 'text-indigo-600 font-bold bg-indigo-50' : ''}
                    ${!isSelected && !isToday && item.currentMonth ? 'text-gray-900 hover:bg-gray-100' : ''}
                    ${!isSelected && !item.currentMonth ? 'text-gray-300' : ''}
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selector */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Hora</span>
            </div>
            
            <div className="relative">
                <input
                    type="text"
                    value={timeInput}
                    onChange={handleTimeInputChange}
                    onClick={() => setShowTimeList(!showTimeList)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center"
                    placeholder="HH:mm"
                />
                
                {showTimeList && (
                    <div ref={timeListRef} className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-10 scrollbar-thin">
                        {generateTimeSlots().map((time) => (
                            <button
                                type="button"
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={`w-full px-4 py-2 text-sm text-left hover:bg-indigo-50 transition-colors ${time === selectedTime ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
