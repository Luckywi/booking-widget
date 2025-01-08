'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
const isPastTime = (date, time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date(date);
    timeDate.setHours(hours, minutes, 0, 0);
    return timeDate < now;
};
const hasAvailableSlotsInWeek = (slots) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Object.entries(slots).some(([dateStr, daySlots]) => {
        const slotDate = new Date(dateStr);
        // Ne vérifier que les créneaux à partir d'aujourd'hui
        return slotDate >= today && daySlots.length > 0;
    });
};
export default function DateStaffSelection({ businessId, serviceId, serviceDuration, selectedService, onSelect }) {
    const isInitialized = useRef(false);
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        return startOfWeek(today, { weekStartsOn: 1 });
    });
    const [availableSlots, setAvailableSlots] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [businessHours, setBusinessHours] = useState(null);
    const [staffHoursMap, setStaffHoursMap] = useState({});
    const weekDays = [...Array(7)].map((_, index) => addDays(weekStart, index));
    const formatDuration = (duration) => {
        const parts = [];
        if (duration.hours > 0) {
            parts.push(`${duration.hours}h`);
        }
        if (duration.minutes > 0) {
            parts.push(`${duration.minutes}min`);
        }
        return parts.join(' ');
    };
    // Effet pour le chargement initial des données
    useEffect(() => {
        const loadData = async () => {
            if (!businessId)
                return;
            try {
                setLoading(true);
                setError(null);
                // Chargement parallèle des données avec gestion d'erreur appropriée
                const [staffResponse, businessHoursDoc, appointmentsResponse] = await Promise.all([
                    getDocs(query(collection(db, 'staff'), where('businessId', '==', businessId))),
                    getDoc(doc(db, 'businessHours', businessId)),
                    getDocs(query(collection(db, 'appointments'), where('businessId', '==', businessId)))
                ]).catch(error => {
                    throw new Error(`Erreur lors du chargement des données: ${error.message}`);
                });
                const staffData = staffResponse.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                if (staffData.length === 0) {
                    throw new Error('Aucun personnel disponible');
                }
                const businessHoursData = businessHoursDoc.exists() ? businessHoursDoc.data() : null;
                if (!businessHoursData) {
                    throw new Error('Horaires non configurés');
                }
                setStaff(staffData);
                setBusinessHours(businessHoursData);
                setAppointments(appointmentsResponse.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()))));
                // Chargement des horaires du personnel
                const hoursMap = {};
                await Promise.all(staffData.map(async (staffMember) => {
                    const staffHoursDoc = await getDoc(doc(db, 'staffHours', staffMember.id));
                    if (staffHoursDoc.exists()) {
                        hoursMap[staffMember.id] = staffHoursDoc.data();
                    }
                }));
                setStaffHoursMap(hoursMap);
                setSelectedStaff(null);
                isInitialized.current = true;
            }
            catch (error) {
                console.error('Erreur:', error);
                setError(error instanceof Error ? error.message : 'Une erreur est survenue');
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, [businessId]);
    const checkTimeSlotAvailability = (currentTime, slotEndTime, staffToCheck, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return staffToCheck.filter(staffMember => {
            var _a, _b;
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = days[date.getDay()];
            const staffHours = (_b = (_a = staffHoursMap[staffMember.id]) === null || _a === void 0 ? void 0 : _a.hours) === null || _b === void 0 ? void 0 : _b[dayName];
            if (!(staffHours === null || staffHours === void 0 ? void 0 : staffHours.isOpen))
                return false;
            const [openHour, openMinute] = staffHours.openTime.split(':').map(Number);
            const [closeHour, closeMinute] = staffHours.closeTime.split(':').map(Number);
            const staffStartTime = new Date(date);
            staffStartTime.setHours(openHour, openMinute, 0, 0);
            const staffEndTime = new Date(date);
            staffEndTime.setHours(closeHour, closeMinute, 0, 0);
            if (currentTime < staffStartTime || slotEndTime > staffEndTime) {
                return false;
            }
            const staffAppointments = appointments.filter(apt => apt.staffId === staffMember.id &&
                apt.status !== 'cancelled' &&
                format(apt.start.toDate(), 'yyyy-MM-dd') === dateStr);
            return !staffAppointments.some(apt => {
                const appointmentStart = apt.start.toDate();
                const appointmentEnd = apt.end.toDate();
                return (currentTime < appointmentEnd && slotEndTime > appointmentStart);
            });
        });
    };
    const fetchDaySlots = async (date) => {
        if (!businessHours || !staff.length)
            return [];
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[date.getDay()];
        const businessDay = businessHours.hours[dayName];
        if (!(businessDay === null || businessDay === void 0 ? void 0 : businessDay.isOpen))
            return [];
        const slots = [];
        const [openHour, openMinute] = businessDay.openTime.split(':').map(Number);
        const [closeHour, closeMinute] = businessDay.closeTime.split(':').map(Number);
        const serviceDurationMinutes = ((serviceDuration === null || serviceDuration === void 0 ? void 0 : serviceDuration.hours) || 0) * 60 + ((serviceDuration === null || serviceDuration === void 0 ? void 0 : serviceDuration.minutes) || 0);
        let currentTime = new Date(date);
        currentTime.setHours(openHour, openMinute, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(closeHour, closeMinute, 0, 0);
        while (currentTime <= endTime) {
            const slotEndTime = new Date(currentTime);
            slotEndTime.setMinutes(slotEndTime.getMinutes() + serviceDurationMinutes);
            if (slotEndTime > endTime)
                break;
            const timeString = format(currentTime, 'HH:mm');
            if (!isPastTime(date, timeString)) {
                const availableStaffForSlot = selectedStaff
                    ? checkTimeSlotAvailability(currentTime, slotEndTime, [selectedStaff], date)
                    : checkTimeSlotAvailability(currentTime, slotEndTime, staff, date);
                if (availableStaffForSlot.length > 0) {
                    slots.push({
                        time: timeString,
                        availableStaff: availableStaffForSlot
                    });
                }
            }
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        return slots;
    };
    const fetchAvailability = async (startDate) => {
        if (!businessHours || !staff.length)
            return;
        setLoading(true);
        setError(null);
        try {
            let currentWeekStart = startDate;
            let slotsFound = false;
            let weeksChecked = 0;
            do {
                const slots = {};
                // On utilise currentWeekStart pour la recherche
                for (const day of [...Array(7)].map((_, index) => addDays(currentWeekStart, index))) {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    slots[dayStr] = await fetchDaySlots(day);
                }
                if (hasAvailableSlotsInWeek(slots)) {
                    setAvailableSlots(slots);
                    setWeekStart(currentWeekStart);
                    slotsFound = true;
                    break;
                }
                // Seulement avancer à la semaine suivante si on n'a pas trouvé de créneaux
                currentWeekStart = addDays(currentWeekStart, 7);
                weeksChecked++;
            } while (!slotsFound && weeksChecked < 8);
            if (!slotsFound) {
                setAvailableSlots({});
                setError('Aucune disponibilité trouvée dans les 8 prochaines semaines');
            }
        }
        catch (error) {
            console.error('Erreur lors du chargement des disponibilités:', error);
            setError('Erreur lors du chargement des disponibilités');
        }
        finally {
            setLoading(false);
        }
    };
    // Effet unifié pour la mise à jour des disponibilités
    useEffect(() => {
        if (!businessHours || !staff.length || !isInitialized.current)
            return;
        fetchAvailability(weekStart);
    }, [
        weekStart,
        selectedStaff,
        businessHours,
        staff,
        serviceDuration,
        appointments,
        staffHoursMap
    ]);
    const handleTimeSelect = (date, slot) => {
        if (!slot.availableStaff.length)
            return;
        const [hours, minutes] = slot.time.split(':').map(Number);
        const selectedDate = new Date(date);
        selectedDate.setHours(hours, minutes, 0, 0);
        if (selectedStaff) {
            onSelect(selectedDate, selectedStaff.id);
        }
        else {
            const randomStaff = slot.availableStaff[Math.floor(Math.random() * slot.availableStaff.length)];
            onSelect(selectedDate, randomStaff.id);
        }
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "bg-gray-50 p-4 rounded-md space-y-4" },
            React.createElement("div", { className: "flex justify-between items-center" },
                React.createElement("div", null,
                    React.createElement("h3", { className: "font-medium text-base" }, selectedService === null || selectedService === void 0 ? void 0 : selectedService.title),
                    React.createElement("p", { className: "text-sm text-gray-500" },
                        formatDuration(serviceDuration),
                        " - ", selectedService === null || selectedService === void 0 ? void 0 :
                        selectedService.price,
                        "\u20AC")),
                React.createElement("div", null,
                    React.createElement(Select, { defaultValue: "no_preference", value: (selectedStaff === null || selectedStaff === void 0 ? void 0 : selectedStaff.id) || "no_preference", onValueChange: (value) => {
                            if (value === "no_preference") {
                                setSelectedStaff(null);
                            }
                            else {
                                const selected = staff.find(s => s.id === value);
                                setSelectedStaff(selected || null);
                            }
                        } },
                        React.createElement(SelectTrigger, { className: "w-48 border-gray-200 hover:border-gray-300 transition-colors" },
                            React.createElement(SelectValue, { placeholder: "Avec qui ?" }, selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : "Avec qui ?")),
                        React.createElement(SelectContent, null,
                            React.createElement(SelectItem, { value: "no_preference", className: "text-gray-500" }, "Sans pr\u00E9f\u00E9rence"),
                            staff.map((member) => (React.createElement(SelectItem, { key: member.id, value: member.id },
                                member.firstName,
                                " ",
                                member.lastName)))))))),
        React.createElement("div", { className: "border rounded-md" },
            React.createElement("div", { className: "grid grid-cols-7 border-b" }, weekDays.map((day) => (React.createElement("div", { key: day.toISOString(), className: "p-3 text-center border-r last:border-r-0" },
                React.createElement("div", { className: "font-medium text-sm" }, format(day, 'EEEE', { locale: fr })),
                React.createElement("div", { className: "text-sm text-gray-500" },
                    format(day, 'd', { locale: fr }),
                    React.createElement("span", { className: "ml-1" }, format(day, 'MMM', { locale: fr }))))))),
            React.createElement("div", { className: "flex justify-between p-2 border-b bg-gray-50" },
                React.createElement("button", { onClick: () => setWeekStart(addDays(weekStart, -7)), className: "p-1.5 rounded-md hover:bg-gray-100 transition-colors" },
                    React.createElement(ChevronLeft, { className: "w-4 h-4" })),
                React.createElement("button", { onClick: () => setWeekStart(addDays(weekStart, 7)), className: "p-1.5 rounded-md hover:bg-gray-100 transition-colors" },
                    React.createElement(ChevronRight, { className: "w-4 h-4" }))),
            React.createElement("div", { className: "grid grid-cols-7" }, weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const slots = availableSlots[dayStr] || [];
                return (React.createElement("div", { key: dayStr, className: "min-h-[400px] p-2 border-r last:border-r-0" }, slots.map((slot) => (React.createElement("button", { key: slot.time, className: `
                  w-full py-2 px-3 mb-2 text-sm rounded-md
                  transition-all duration-200 font-medium
                  ${selectedStaff
                        ? slot.availableStaff.some(s => s.id === selectedStaff.id)
                            ? 'hover:bg-black hover:text-white bg-white border border-gray-200'
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        : slot.availableStaff.length > 0
                            ? 'hover:bg-black hover:text-white bg-white border border-gray-200'
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed'}
                `, disabled: selectedStaff
                        ? !slot.availableStaff.some(s => s.id === selectedStaff.id)
                        : slot.availableStaff.length === 0, onClick: () => handleTimeSelect(day, slot) }, slot.time)))));
            }))),
        loading && (React.createElement("div", { className: "text-center text-gray-500" }, "Chargement des disponibilit\u00E9s...")),
        !loading && Object.values(availableSlots).every(slots => slots.length === 0) && (React.createElement("div", { className: "text-center text-gray-500 p-4" }, "Aucun cr\u00E9neau disponible dans les 8 prochaines semaines. Veuillez nous contacter directement pour plus d'informations."))));
}
//# sourceMappingURL=DateStaffSelection.js.map