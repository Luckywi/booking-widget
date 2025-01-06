'use client';

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Service } from '@/types/booking';
import DateStaffSelection from './DateStaffSelection';
import ClientForm from './ClientForm'; // Ajout de l'import
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft
} from 'lucide-react';

interface BookingWidgetProps {
  businessId: string;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    businessId: string;
  }

  interface ServiceCategory {
    id: string;
    title: string;
    order: number;
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
const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);


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
  
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
  
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.order - b.order) as ServiceCategory[];
  
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
  
        setServices(servicesData);
        setServiceCategories(categoriesData);
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
      <div className="flex justify-between px-6 py-4 border-b">
    {[1, 2, 3].map((number) => (
      <div 
        key={number} 
        className="flex flex-col items-center gap-2"
      >
        <div className={`
          w-8 h-8 rounded flex items-center justify-center
          text-sm transition-all duration-300
          ${step >= number 
            ? 'bg-black text-white' 
            : 'bg-gray-50 text-gray-400'
          }
        `}>
          {number}
        </div>
        <span className={`
          text-xs
          ${step >= number ? 'text-gray-700' : 'text-gray-400'}
        `}>
          {number === 1 ? 'Service' : number === 2 ? 'Date' : 'Informations'}
        </span>
      </div>
    ))}
  </div>

      <div className="p-4">
      {step === 1 && (
  <div className="space-y-8">
    {/* En-tête principal */}
    <div className="space-y-2">
      <h2 className="text-xl font-medium">Sélectionner un service</h2>
      <p className="text-sm text-gray-500">Choisissez le service que vous souhaitez réserver</p>
    </div>
    
    {/* Sections de services */}
    <div className="space-y-8">
      {serviceCategories.map((category) => (
        <div key={category.id} className="space-y-4">
          {/* Titre de catégorie */}
          <h3 className="text-base font-medium">
            {category.title}
          </h3>
          
          {/* Liste des services de la catégorie */}
          <div className="space-y-3">
            {services
              .filter(service => service.categoryId === category.id)
              .map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`
                    p-4 rounded-md border cursor-pointer
                    transition-all duration-200
                    ${selectedService?.id === service.id 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <h4 className="font-medium text-base">{service.title}</h4>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-base">{service.price}€</p>
                      <p className="text-sm text-gray-500">

                        {formatDuration(service.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
  
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Choisir la date et l'heure</h2>
              <button 
  onClick={() => setStep(1)}
  className="text-sm text-gray-500 hover:text-black transition-colors duration-200 flex items-center gap-1"
>
  <ChevronLeft className="w-4 h-4" />
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
        className="text-sm text-gray-500 hover:text-black transition-colors duration-200 flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
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
            staffId: selectedStaffMember.id,    // Référence au staff
            serviceId: selectedService.id,       // Référence au service
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