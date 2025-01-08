'use client';
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
export default function ClientForm({ service, dateTime, staff, onSubmit, onBack }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "bg-gray-50 p-4 rounded-lg space-y-2" },
            React.createElement("h3", { className: "font-medium" }, "R\u00E9sum\u00E9 de votre r\u00E9servation"),
            React.createElement("div", { className: "text-sm text-gray-600" },
                React.createElement("p", null,
                    service.title,
                    " - ",
                    service.price,
                    "\u20AC"),
                React.createElement("p", null,
                    "Le ",
                    format(dateTime, 'EEEE d MMMM yyyy', { locale: fr }),
                    " \u00E0 ",
                    format(dateTime, 'HH:mm')),
                React.createElement("p", null,
                    "Avec ",
                    staff.firstName,
                    " ",
                    staff.lastName))),
        React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" },
            React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Pr\u00E9nom"),
                    React.createElement(Input, { required: true, value: formData.firstName, onChange: e => setFormData(prev => (Object.assign(Object.assign({}, prev), { firstName: e.target.value }))) })),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Nom"),
                    React.createElement(Input, { required: true, value: formData.lastName, onChange: e => setFormData(prev => (Object.assign(Object.assign({}, prev), { lastName: e.target.value }))) }))),
            React.createElement("div", null,
                React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Email"),
                React.createElement(Input, { type: "email", required: true, value: formData.email, onChange: e => setFormData(prev => (Object.assign(Object.assign({}, prev), { email: e.target.value }))) })),
            React.createElement("div", null,
                React.createElement("label", { className: "block text-sm font-medium mb-1" }, "T\u00E9l\u00E9phone"),
                React.createElement(Input, { type: "tel", required: true, value: formData.phone, onChange: e => setFormData(prev => (Object.assign(Object.assign({}, prev), { phone: e.target.value }))) })),
            React.createElement("div", { className: "flex justify-between pt-4" },
                React.createElement(Button, { type: "button", variant: "outline", onClick: onBack }, "Retour"),
                React.createElement(Button, { type: "submit" }, "Confirmer la r\u00E9servation")))));
}
//# sourceMappingURL=ClientForm.js.map