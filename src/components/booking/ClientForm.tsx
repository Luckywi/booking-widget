'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Service, Staff } from '@/types/booking';

interface ClientFormProps {
  service: Service;
  dateTime: Date;
  staff: Staff;
  onSubmit: (clientData: ClientFormData) => void;
  onBack: () => void;
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function ClientForm({ service, dateTime, staff, onSubmit, onBack }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Résumé de la réservation */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="font-medium">Résumé de votre réservation</h3>
        <div className="text-sm text-gray-600">
          <p>{service.title} - {service.price}€</p>
          <p>Le {format(dateTime, 'EEEE d MMMM yyyy', { locale: fr })} à {format(dateTime, 'HH:mm')}</p>
          <p>Avec {staff.firstName} {staff.lastName}</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <Input
              required
              value={formData.firstName}
              onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <Input
              required
              value={formData.lastName}
              onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <Input
            type="tel"
            required
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button type="submit">
            Confirmer la réservation
          </Button>
        </div>
      </form>
    </div>
  );
}