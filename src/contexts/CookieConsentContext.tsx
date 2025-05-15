
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CookieConsentContextType {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  cookieConsent: string | null;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<string | null>(null);

  useEffect(() => {
    // Check for cookie consent when component mounts
    const savedConsent = localStorage.getItem('cookieConsent');
    setCookieConsent(savedConsent);
    
    // Show modal if no consent has been given
    if (!savedConsent) {
      setShowModal(true);
    }
  }, []);

  const resetConsent = () => {
    localStorage.removeItem('cookieConsent');
    setCookieConsent(null);
    setShowModal(true);
  };

  return (
    <CookieConsentContext.Provider value={{ showModal, setShowModal, cookieConsent, resetConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
