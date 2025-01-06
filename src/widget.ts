// src/widget.ts
'use client';

import { createRoot } from 'react-dom/client';
import React from 'react';
import BookingWidget from '@/components/booking/BookingWidget';

export interface WidgetConfig {
    target: string;
    businessId: string;
}

declare global {
    interface Window {
        initBookingWidget: (config: WidgetConfig) => void;
    }
}

class BookingWidgetLoader {
    constructor(config: WidgetConfig) {
        const targetElement = document.querySelector(config.target);
        
        if (!targetElement) {
            console.error(`Element ${config.target} not found`);
            return;
        }

        const root = createRoot(targetElement);
        root.render(
            React.createElement(
                React.StrictMode,
                null,
                React.createElement(BookingWidget, { businessId: config.businessId })
            )
        );
    }
}

window.initBookingWidget = (config: WidgetConfig) => {
    return new BookingWidgetLoader(config);
};

export default BookingWidgetLoader;