'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Check, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
export default function ConfirmationPage() {
    const params = useParams();
    const [appointment, setAppointment] = useState(null);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showAllAppointments, setShowAllAppointments] = useState(false);
    const fetchAppointmentHistory = async (clientEmail) => {
        try {
            // D'abord, récupérer tous les rendez-vous
            const appointmentsQuery = query(collection(db, 'appointments'), where('clientEmail', '==', clientEmail), where('status', 'in', ['confirmed', 'cancelled']));
            const querySnapshot = await getDocs(appointmentsQuery);
            // Ensuite, pour chaque rendez-vous, récupérer les détails
            const appointments = await Promise.all(querySnapshot.docs.map(async (appointmentDoc) => {
                const data = appointmentDoc.data();
                let serviceDetails;
                let staffDetails;
                try {
                    // Récupération des détails du service
                    const serviceDoc = await getDoc(doc(db, 'services', data.serviceId));
                    serviceDetails = serviceDoc.exists() ? serviceDoc.data() : null;
                    // Récupération des détails du staff
                    const staffDoc = await getDoc(doc(db, 'staff', data.staffId));
                    staffDetails = staffDoc.exists() ? staffDoc.data() : null;
                }
                catch (error) {
                    console.error('Erreur lors de la récupération des détails:', error);
                }
                // Construction de l'objet rendez-vous
                return {
                    id: appointmentDoc.id,
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    createdAt: data.createdAt.toDate(),
                    clientEmail: data.clientEmail,
                    clientName: data.clientName,
                    clientPhone: data.clientPhone,
                    status: data.status,
                    service: {
                        title: (serviceDetails === null || serviceDetails === void 0 ? void 0 : serviceDetails.title) || 'Service inconnu',
                        price: (serviceDetails === null || serviceDetails === void 0 ? void 0 : serviceDetails.price) || 0
                    },
                    staff: {
                        firstName: (staffDetails === null || staffDetails === void 0 ? void 0 : staffDetails.firstName) || '',
                        lastName: (staffDetails === null || staffDetails === void 0 ? void 0 : staffDetails.lastName) || ''
                    }
                };
            }));
            // Filtrer et trier les résultats
            return appointments
                .filter(apt => apt.id !== params.id)
                .sort((a, b) => b.start.getTime() - a.start.getTime());
        }
        catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return [];
        }
    };
    const handleCancelAppointment = async () => {
        if (!appointment || !isFuture(appointment.start))
            return;
        try {
            setCancelLoading(true);
            await updateDoc(doc(db, 'appointments', appointment.id), {
                status: 'cancelled'
            });
            setAppointment(prev => prev ? Object.assign(Object.assign({}, prev), { status: 'cancelled' }) : null);
        }
        catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
            setError('Erreur lors de l\'annulation du rendez-vous');
        }
        finally {
            setCancelLoading(false);
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            if (!params.id)
                return;
            try {
                setLoading(true);
                const appointmentDoc = await getDoc(doc(db, 'appointments', params.id));
                if (!appointmentDoc.exists()) {
                    setError('Rendez-vous non trouvé');
                    return;
                }
                const data = appointmentDoc.data();
                // Récupérer les détails du service
                const serviceDoc = await getDoc(doc(db, 'services', data.serviceId));
                const serviceData = serviceDoc.data();
                // Récupérer les détails du staff
                const staffDoc = await getDoc(doc(db, 'staff', data.staffId));
                const staffData = staffDoc.data();
                const currentAppointment = {
                    id: appointmentDoc.id,
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    createdAt: data.createdAt.toDate(),
                    clientEmail: data.clientEmail,
                    clientName: data.clientName,
                    clientPhone: data.clientPhone,
                    status: data.status,
                    service: {
                        title: (serviceData === null || serviceData === void 0 ? void 0 : serviceData.title) || 'Service inconnu',
                        price: (serviceData === null || serviceData === void 0 ? void 0 : serviceData.price) || 0
                    },
                    staff: {
                        firstName: (staffData === null || staffData === void 0 ? void 0 : staffData.firstName) || '',
                        lastName: (staffData === null || staffData === void 0 ? void 0 : staffData.lastName) || ''
                    }
                };
                setAppointment(currentAppointment);
                if (data.clientEmail) {
                    const history = await fetchAppointmentHistory(data.clientEmail);
                    setPastAppointments(history);
                }
            }
            catch (error) {
                console.error('Erreur:', error);
                setError('Erreur lors du chargement des données');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);
    if (loading) {
        return (React.createElement("div", { className: "min-h-screen flex items-center justify-center" },
            React.createElement("div", { className: "text-center" }, "Chargement...")));
    }
    if (error || !appointment) {
        return (React.createElement("div", { className: "min-h-screen flex items-center justify-center" },
            React.createElement(Card, { className: "w-full max-w-lg p-6" },
                React.createElement("div", { className: "text-center" },
                    React.createElement("h1", { className: "text-xl font-semibold text-red-600 mb-2" }, error || 'Rendez-vous non trouvé'),
                    React.createElement(Link, { href: "/" },
                        React.createElement(Button, null, "Retourner \u00E0 l'accueil"))))));
    }
    const isAppointmentCancellable = appointment.status === 'confirmed' &&
        isFuture(appointment.start);
    return (React.createElement("div", { className: "min-h-screen flex items-center justify-center p-4" },
        React.createElement(Card, { className: "w-full max-w-2xl p-6 space-y-6" },
            React.createElement("div", { className: "text-center" }, appointment.status === 'cancelled' ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4" },
                    React.createElement(AlertCircle, { className: "w-6 h-6 text-red-600" })),
                React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Rendez-vous annul\u00E9"),
                React.createElement("p", { className: "mt-2 mb-6 text-gray-600" }, "Ce rendez-vous a \u00E9t\u00E9 annul\u00E9"),
                React.createElement(Link, { href: "/", className: "block" },
                    React.createElement(Button, { className: "w-fit py-2 text-base bg-black hover:bg-gray-800" }, "Prendre un nouveau rendez-vous ?")))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4" },
                    React.createElement(Check, { className: "w-6 h-6 text-green-600" })),
                React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "R\u00E9servation confirm\u00E9e !"),
                React.createElement("p", { className: "mt-2 text-gray-600" }, "Votre rendez-vous a \u00E9t\u00E9 enregistr\u00E9 avec succ\u00E8s")))),
            React.createElement("div", { className: "bg-gray-50 rounded-lg p-4 space-y-3" },
                React.createElement("h2", { className: "font-medium" }, "D\u00E9tails de votre rendez-vous :"),
                React.createElement("div", { className: "space-y-2 text-sm" },
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Service :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, appointment.service.title)),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Date :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, format(appointment.start, 'EEEE d MMMM yyyy', { locale: fr }))),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Heure :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, format(appointment.start, 'HH:mm'))),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Avec :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" },
                            appointment.staff.firstName,
                            " ",
                            appointment.staff.lastName)),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Prix :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" },
                            appointment.service.price,
                            "\u20AC")),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Client :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, appointment.clientName)),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Email :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, appointment.clientEmail)),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "T\u00E9l\u00E9phone :"),
                        ' ',
                        React.createElement("span", { className: "font-medium" }, appointment.clientPhone)),
                    React.createElement("p", null,
                        React.createElement("span", { className: "text-gray-500" }, "Statut :"),
                        ' ',
                        React.createElement("span", { className: `font-medium ${appointment.status === 'cancelled'
                                ? 'text-red-600'
                                : 'text-green-600'}` }, appointment.status === 'cancelled' ? 'Annulé' : 'Confirmé')))),
            isAppointmentCancellable && (React.createElement("div", { className: "flex justify-center" },
                React.createElement(Button, { variant: "destructive", onClick: handleCancelAppointment, disabled: cancelLoading }, cancelLoading ? 'Annulation...' : 'Annuler ce rendez-vous'))),
            pastAppointments.length > 0 && (React.createElement("div", { className: "mt-8" },
                React.createElement("h2", { className: "font-medium flex items-center gap-2 mb-4" },
                    React.createElement(Calendar, { className: "w-5 h-5" }),
                    "Historique de vos rendez-vous"),
                React.createElement("div", { className: "space-y-4" },
                    (showAllAppointments ? pastAppointments : pastAppointments.slice(0, 2)).map((apt) => (React.createElement("div", { key: apt.id, className: "p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "font-medium" }, apt.service.title),
                            React.createElement("p", { className: "text-sm text-gray-500" }, format(apt.start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })),
                            React.createElement("p", { className: "text-sm text-gray-500" },
                                "Avec ",
                                apt.staff.firstName,
                                " ",
                                apt.staff.lastName)),
                        React.createElement("div", null,
                            React.createElement("span", { className: `px-3 py-1 rounded-full text-sm
              ${apt.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'}` }, apt.status === 'cancelled' ? 'Annulé' : 'Effectué'))))),
                    pastAppointments.length > 2 && (React.createElement("button", { onClick: () => setShowAllAppointments(!showAllAppointments), className: "w-full mt-4 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm py-2" },
                        React.createElement("span", null, showAllAppointments ? 'Voir moins' : 'Voir plus'),
                        showAllAppointments ? (React.createElement(ChevronUp, { className: "w-4 h-4" })) : (React.createElement(ChevronDown, { className: "w-4 h-4" }))))))),
            appointment.status === 'confirmed' && (React.createElement("div", { className: "text-center text-sm text-gray-500" },
                React.createElement("p", null,
                    "Un email de confirmation a \u00E9t\u00E9 envoy\u00E9 \u00E0 ",
                    appointment.clientEmail))),
            appointment.status === 'confirmed' && (React.createElement("div", { className: "flex justify-center gap-4" },
                React.createElement(Link, { href: "/" },
                    React.createElement(Button, { variant: "outline" }, "R\u00E9server un autre rendez-vous")),
                React.createElement(Button, { onClick: () => window.print(), variant: "outline" }, "Imprimer"))),
            appointment.status === 'cancelled' && (React.createElement("div", { className: "flex justify-center" },
                React.createElement(Button, { onClick: () => window.print(), variant: "outline" }, "Imprimer"))))));
}
//# sourceMappingURL=page.js.map