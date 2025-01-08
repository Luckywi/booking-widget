import { createRoot } from 'react-dom/client';
import React from 'react';
import BookingWidget from '@/components/booking/BookingWidget';
class BookingWidgetLoader {
    constructor(config) {
        const targetElement = document.querySelector(config.target);
        if (!targetElement) {
            console.error(`Element ${config.target} not found`);
            return;
        }
        const widgetContainer = document.createElement('div');
        targetElement.appendChild(widgetContainer);
        const root = createRoot(widgetContainer);
        root.render(React.createElement(React.StrictMode, null, React.createElement(BookingWidget, { businessId: config.businessId })));
    }
}
window.initBookingWidget = (config) => {
    return new BookingWidgetLoader(config);
};
export default BookingWidgetLoader;
//# sourceMappingURL=widget.js.map