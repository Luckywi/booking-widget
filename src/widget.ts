import { createRoot } from 'react-dom/client';
import React from 'react';
import BookingWidget from '@/components/booking/BookingWidget';

interface WidgetConfig {
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

        const widgetContainer = document.createElement('div');
        targetElement.appendChild(widgetContainer);

        const root = createRoot(widgetContainer);
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