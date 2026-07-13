import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isBefore,
  startOfDay,
} from 'date-fns';
import axios from 'axios';

const AppointmentCalendar = ({ doctorId, onSlotSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load appointments for the current month
  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    }
  }, [currentMonth, doctorId]);

  // Load available slots when a date is selected
  useEffect(() => {
    if (selectedDate && doctorId) {
      loadAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/appointments`,
        {
          params: {
            doctorId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/doctors/${doctorId}/availability`,
        {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd'),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayAppointments = (day) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.appointmentDate), day)
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayAppointments = getDayAppointments(currentDay);
        const isDisabled = isBefore(currentDay, startOfDay(new Date()));
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isTodayDate = isToday(currentDay);

        days.push(
          <button
            key={currentDay}
            onClick={() => !isDisabled && setSelectedDate(currentDay)}
            disabled={isDisabled}
            className={`
              relative h-20 border rounded-lg p-2 transition-all
              ${isDisabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'hover:border-blue-400'}
              ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}
              ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
              ${isTodayDate ? 'bg-blue-100 border-blue-300' : ''}
            `}
          >
            <div className="flex flex-col h-full">
              <span
                className={`text-sm font-medium ${
                  isTodayDate ? 'text-blue-600 font-bold' : ''
                }`}
              >
                {format(currentDay, 'd')}
              </span>

              {dayAppointments.length > 0 && (
                <div className="flex-1 flex items-end justify-center">
                  <div className="flex space-x-1">
                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          apt.status === 'confirmed'
                            ? 'bg-green-500'
                            : apt.status === 'pending'
                            ? 'bg-yellow-500'
                            : apt.status === 'completed'
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                        }`}
                        title={apt.status}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{dayAppointments.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={day} className="grid grid-cols-7 gap-2">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-2">{rows}</div>;
  };

  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Select a date to view available time slots</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading available slots...</p>
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No available slots for {format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
      );
    }

    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Available Time Slots - {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedSlot(slot);
                if (onSlotSelect) {
                  onSlotSelect({
                    date: selectedDate,
                    time: slot.time,
                    slot: slot,
                  });
                }
              }}
              className={`
                px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${
                  selectedSlot?.time === slot.time
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
                ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!slot.available}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Appointment Calendar
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {renderHeader()}
          {renderDaysOfWeek()}
          {renderCells()}
          {renderLegend()}
        </div>

        {/* Time Slots */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-gray-50 rounded-lg p-4">
            {renderTimeSlots()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
