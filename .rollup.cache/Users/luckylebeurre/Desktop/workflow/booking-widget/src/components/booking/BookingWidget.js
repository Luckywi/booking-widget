'use client';
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import DateStaffSelection from './DateStaffSelection';
import ClientForm from './ClientForm'; // Ajout de l'import
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
export default function BookingWidget({ businessId }) {
    const [step, setStep] = useState(1);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [selectedStaffMember, setSelectedStaffMember] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const router = useRouter();
    const [serviceCategories, setServiceCategories] = useState([]);
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
    const handleServiceSelect = (service) => {
        setSelectedService(service);
        // Réinitialiser l'état lors du passage à l'étape 2
        setStep(2);
    };
    useEffect(() => {
        const fetchBusinessData = async () => {
            try {
                setLoading(true);
                // Charger les services, les catégories et les collaborateurs en parallèle
                const [servicesSnapshot, categoriesSnapshot, staffSnapshot] = await Promise.all([
                    getDocs(query(collection(db, 'services'), where('businessId', '==', businessId))),
                    getDocs(query(collection(db, 'serviceCategories'), where('businessId', '==', businessId))),
                    getDocs(query(collection(db, 'staff'), where('businessId', '==', businessId)))
                ]);
                if (servicesSnapshot.empty) {
                    setError('Business non trouvé ou aucun service disponible');
                    return;
                }
                const servicesData = servicesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                const categoriesData = categoriesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()))).sort((a, b) => a.order - b.order);
                const staffData = staffSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                setServices(servicesData);
                setServiceCategories(categoriesData);
                setStaffList(staffData);
                setError(null);
            }
            catch (err) {
                console.error('Erreur lors du chargement des données:', err);
                setError('Erreur lors du chargement des données');
            }
            finally {
                setLoading(false);
            }
        };
        if (businessId) {
            fetchBusinessData();
        }
    }, [businessId]);
    if (loading) {
        return (React.createElement(Card, { className: "w-full max-w-3xl mx-auto p-4" },
            React.createElement("div", { className: "text-center" }, "Chargement...")));
    }
    if (error) {
        return (React.createElement(Card, { className: "w-full max-w-3xl mx-auto p-4" },
            React.createElement("div", { className: "text-red-500 text-center" }, error)));
    }
    return (React.createElement(Card, { className: "w-full max-w-3xl mx-auto" },
        React.createElement("div", { className: "flex justify-between px-6 py-4 border-b" }, [1, 2, 3].map((number) => (React.createElement("div", { key: number, className: "flex flex-col items-center gap-2" },
            React.createElement("div", { className: `
          w-8 h-8 rounded flex items-center justify-center
          text-sm transition-all duration-300
          ${step >= number
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-400'}
        ` }, number),
            React.createElement("span", { className: `
          text-xs
          ${step >= number ? 'text-gray-700' : 'text-gray-400'}
        ` }, number === 1 ? 'Service' : number === 2 ? 'Date' : 'Informations'))))),
        React.createElement("div", { className: "p-4" },
            step === 1 && (React.createElement("div", { className: "space-y-8" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("h2", { className: "text-xl font-medium" }, "S\u00E9lectionner un service"),
                    React.createElement("p", { className: "text-sm text-gray-500" }, "Choisissez le service que vous souhaitez r\u00E9server")),
                React.createElement("div", { className: "space-y-8" }, serviceCategories.map((category) => (React.createElement("div", { key: category.id, className: "space-y-4" },
                    React.createElement("h3", { className: "text-base font-medium" }, category.title),
                    React.createElement("div", { className: "space-y-3" }, services
                        .filter(service => service.categoryId === category.id)
                        .map((service) => (React.createElement("div", { key: service.id, onClick: () => handleServiceSelect(service), className: `
                    p-4 rounded-md border cursor-pointer
                    transition-all duration-200
                    ${(selectedService === null || selectedService === void 0 ? void 0 : selectedService.id) === service.id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'}
                  ` },
                        React.createElement("div", { className: "flex justify-between items-start gap-4" },
                            React.createElement("div", { className: "space-y-1.5" },
                                React.createElement("h4", { className: "font-medium text-base" }, service.title),
                                React.createElement("p", { className: "text-sm text-gray-500" }, service.description)),
                            React.createElement("div", { className: "text-right shrink-0" },
                                React.createElement("p", { className: "font-medium text-base" },
                                    service.price,
                                    "\u20AC"),
                                React.createElement("p", { className: "text-sm text-gray-500" }, formatDuration(service.duration)))))))))))))),
            step === 2 && (React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex justify-between items-center" },
                    React.createElement("h2", { className: "text-xl font-semibold" }, "Choisir la date et l'heure"),
                    React.createElement("button", { onClick: () => setStep(1), className: "text-sm text-gray-500 hover:text-black transition-colors duration-200 flex items-center gap-1" },
                        React.createElement(ChevronLeft, { className: "w-4 h-4" }),
                        "Modifier le service")),
                React.createElement(DateStaffSelection, { key: `date-staff-${selectedService === null || selectedService === void 0 ? void 0 : selectedService.id}`, businessId: businessId, serviceId: (selectedService === null || selectedService === void 0 ? void 0 : selectedService.id) || '', serviceDuration: (selectedService === null || selectedService === void 0 ? void 0 : selectedService.duration) || { hours: 0, minutes: 0 }, selectedService: selectedService, onSelect: (datetime, staffId) => {
                        setSelectedDateTime(datetime);
                        const staffMember = staffId
                            ? staffList.find(s => s.id === staffId) || null
                            : null;
                        setSelectedStaffMember(staffMember);
                        setStep(3);
                    } }))),
            step === 3 && selectedService && selectedDateTime && selectedStaffMember && (React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex justify-between items-center" },
                    React.createElement("h2", { className: "text-xl font-semibold" }, "Vos informations"),
                    React.createElement("button", { onClick: () => setStep(2), className: "text-sm text-gray-500 hover:text-black transition-colors duration-200 flex items-center gap-1" },
                        React.createElement(ChevronLeft, { className: "w-4 h-4" }),
                        "Modifier la date")),
                React.createElement(ClientForm, { service: selectedService, dateTime: selectedDateTime, staff: selectedStaffMember, onSubmit: async (clientData) => {
                        try {
                            const endDateTime = new Date(selectedDateTime);
                            endDateTime.setHours(endDateTime.getHours() + selectedService.duration.hours, endDateTime.getMinutes() + selectedService.duration.minutes);
                            const appointmentData = {
                                businessId: businessId,
                                staffId: selectedStaffMember.id, // Référence au staff
                                serviceId: selectedService.id, // Référence au service
                                clientName: `${clientData.firstName} ${clientData.lastName}`,
                                clientEmail: clientData.email,
                                clientPhone: clientData.phone,
                                start: selectedDateTime,
                                end: endDateTime,
                                status: 'confirmed',
                                createdAt: new Date(),
                                notes: ''
                            };
                            const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
                            router.push(`/confirmation/${docRef.id}`);
                        }
                        catch (error) {
                            console.error('Erreur lors de la création du rendez-vous:', error);
                        }
                    }, onBack: () => setStep(2) }))))));
}
//# sourceMappingURL=BookingWidget.js.map