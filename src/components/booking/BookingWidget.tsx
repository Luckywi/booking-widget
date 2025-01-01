'use client';

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Service } from '@/types/booking';
import DateStaffSelection from './DateStaffSelection';
import ClientForm from './ClientForm'; // Ajout de l'import
import { useRouter } from 'next/navigation';

interface BookingWidgetProps {
  businessId: string;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    businessId: string;
  }
  

export default function BookingWidget({ businessId }: BookingWidgetProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);
const [staffList, setStaffList] = useState<Staff[]>([]);
const router = useRouter();


  const formatDuration = (duration: { hours: number; minutes: number }) => {
    const parts = [];
    if (duration.hours > 0) {
      parts.push(`${duration.hours}h`);
    }
    if (duration.minutes > 0) {
      parts.push(`${duration.minutes}min`);
    }
    return parts.join(' ');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    // Réinitialiser l'état lors du passage à l'étape 2
    setStep(2);
  };
  


  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        
        // Charger les services
        const servicesQuery = query(
          collection(db, 'services'),
          where('businessId', '==', businessId)
        );
  
        // Charger les collaborateurs
        const staffQuery = query(
          collection(db, 'staff'),
          where('businessId', '==', businessId)
        );
  
        const [servicesSnapshot, staffSnapshot] = await Promise.all([
          getDocs(servicesQuery),
          getDocs(staffQuery)
        ]);
        
        if (servicesSnapshot.empty) {
          setError('Business non trouvé ou aucun service disponible');
          return;
        }
  
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
  
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
  
        setServices(servicesData);
        setStaffList(staffData);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
  
    if (businessId) {
      fetchBusinessData();
    }
  }, [businessId]);

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-4">
        <div className="text-center">Chargement...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-4">
        <div className="text-red-500 text-center">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between p-4 border-b">
        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className={`flex items-center justify-center w-8 h-8 rounded-full 
              ${step >= number ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {number}
          </div>
        ))}
      </div>
  
      <div className="p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Sélectionner un service</h2>
            {services.map((service) => (
              <Card 
                key={service.id} 
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedService?.id === service.id ? 'border-2 border-blue-500' : ''
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{service.title}</h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{service.price}€</p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(service.duration)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
  
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Choisir la date et l'heure</h2>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Modifier le service
              </button>
            </div>
            <DateStaffSelection
              key={`date-staff-${selectedService?.id}`}
              businessId={businessId}
              serviceId={selectedService?.id || ''}
              serviceDuration={selectedService?.duration || { hours: 0, minutes: 0 }}
              selectedService={selectedService}
              onSelect={(datetime, staffId) => {
                setSelectedDateTime(datetime);
                const staffMember = staffId 
                  ? staffList.find(s => s.id === staffId) || null 
                  : null;
                setSelectedStaffMember(staffMember);
                setStep(3);
              }}
            />
          </div>
        )}
  
  {step === 3 && selectedService && selectedDateTime && selectedStaffMember && (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Vos informations</h2>
      <button 
        onClick={() => setStep(2)}
        className="text-sm text-blue-500 hover:text-blue-700"
      >
        Modifier la date
      </button>
    </div>
    <ClientForm
      service={selectedService}
      dateTime={selectedDateTime}
      staff={selectedStaffMember}
      onSubmit={async (clientData) => {
        try {
          const endDateTime = new Date(selectedDateTime);
          endDateTime.setHours(
            endDateTime.getHours() + selectedService.duration.hours,
            endDateTime.getMinutes() + selectedService.duration.minutes
          );
      
          const appointmentData = {
            businessId: businessId,
            staffId: selectedStaffMember.id,
            serviceId: selectedService.id,
            clientName: `${clientData.firstName} ${clientData.lastName}`,
            clientEmail: clientData.email,
            clientPhone: clientData.phone,
            start: selectedDateTime,
            end: endDateTime,
            status: 'confirmed',
            createdAt: new Date(),
            service: {
              title: selectedService.title,
              price: selectedService.price
            },
            staff: {
              firstName: selectedStaffMember.firstName,
              lastName: selectedStaffMember.lastName
            }
          };
      
          const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
          router.push(`/confirmation/${docRef.id}`);
          
        } catch (error) {
          console.error('Erreur lors de la création du rendez-vous:', error);
        }
      }}
              onBack={() => setStep(2)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}