/**
 * Opens the Calendly popup widget directly on the webpage.
 * Falls back to opening the link in a new window if the widget fails to load.
 */
export const openCalendly = (e?: any) => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  
  const Calendly = (window as any).Calendly;
  if (Calendly) {
    Calendly.initPopupWidget({
      url: 'https://calendly.com/ifsinrem'
    });
  } else {
    window.open('https://calendly.com/ifsinrem', '_blank', 'noopener,noreferrer');
  }
};
