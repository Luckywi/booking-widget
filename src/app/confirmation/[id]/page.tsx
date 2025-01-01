'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Ajout de cet import


export default function ConfirmationPage() {
    const params = useParams(); // Utilisation du hook au lieu de props
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchAppointment = async () => {
        try {
          const appointmentDoc = await getDoc(doc(db, 'appointments', params.id as string));
          if (appointmentDoc.exists()) {
            const data = appointmentDoc.data();
            setAppointment({
              id: appointmentDoc.id,
              ...data,
              start: data.start.toDate(),
              end: data.end.toDate(),
              createdAt: data.createdAt.toDate()
            });
          } else {
            setError('Rendez-vous non trouvé');
          }
        } catch (error) {
          console.error('Erreur:', error);
          setError('Erreur lors du chargement des données');
        } finally {
          setLoading(false);
        }
      };
  
      if (params.id) {
        fetchAppointment();
      }
    }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg p-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">
              {error || 'Rendez-vous non trouvé'}
            </h1>
            <Link href="/">
              <Button>Retourner à l'accueil</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Réservation confirmée !</h1>
          <p className="mt-2 text-gray-600">
            Votre rendez-vous a été enregistré avec succès
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h2 className="font-medium">Détails de votre rendez-vous :</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Service :</span>{' '}
              <span className="font-medium">{appointment.service.title}</span>
            </p>
            <p>
              <span className="text-gray-500">Date :</span>{' '}
              <span className="font-medium">
                {format(appointment.start, 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Heure :</span>{' '}
              <span className="font-medium">
                {format(appointment.start, 'HH:mm')}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Avec :</span>{' '}
              <span className="font-medium">
                {appointment.staff.firstName} {appointment.staff.lastName}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Prix :</span>{' '}
              <span className="font-medium">{appointment.service.price}€</span>
            </p>
            <p>
              <span className="text-gray-500">Client :</span>{' '}
              <span className="font-medium">{appointment.clientName}</span>
            </p>
            <p>
              <span className="text-gray-500">Email :</span>{' '}
              <span className="font-medium">{appointment.clientEmail}</span>
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Un email de confirmation a été envoyé à {appointment.clientEmail}</p>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button variant="outline">
              Réserver un autre rendez-vous
            </Button>
          </Link>
          <Button
            onClick={() => window.print()}
            variant="outline"
          >
            Imprimer
          </Button>
        </div>
      </Card>
    </div>
  );
}