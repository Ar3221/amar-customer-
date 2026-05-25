export const generateWhatsAppLink = (
  phoneNumber: string,
  message: string
): string => {
  // Remove all non-numeric characters from the phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const getProductInquiryMessage = (
  productName: string,
  productSku: string,
  quantity?: number
): string => {
  if (quantity) {
    return `Hello Amar Industries Sales Team, I am interested in ordering ${quantity.toLocaleString()} units of ${productName} (SKU: ${productSku}). Could you please share the exact pricing and lead time?`;
  }
  return `Hello Amar Industries Sales Team, I would like to inquire about the technical specifications and MOQ for ${productName} (SKU: ${productSku}).`;
};

export const getGeneralSupportMessage = (): string => {
  return `Hello Amar Industries Support, I need some assistance with the customer order portal.`;
};
