// src/types/booking.ts
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: {
    hours: number;
    minutes: number;
  };
  categoryId: string;
  businessId: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  businessId: string;
}

export interface BookingSlot {
  datetime: Date;
  staffId: string | null;
}

export interface ServiceCategory {
  id: string;
  title: string;
  order: number;
  businessId: string;
}