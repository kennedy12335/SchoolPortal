export interface PayerInfo {
  name: string;
  email: string;
  relationship: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  relationship?: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name);
};

export const validatePayerInfo = (field: keyof PayerInfo, value: string): string | undefined => {
  switch (field) {
    case 'name':
      if (!value.trim()) {
        return 'Name is required';
      }
      if (!validateName(value)) {
        return 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)';
      }
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters long';
      }
      return undefined;

    case 'email':
      if (!value.trim()) {
        return 'Email is required';
      }
      if (!validateEmail(value)) {
        return 'Please enter a valid email address ending with .com';
      }
      return undefined;

    case 'relationship':
      if (!value) {
        return 'Please select a relationship';
      }
      return undefined;

    default:
      return undefined;
  }
};

export const validatePayerForm = (payerInfo: PayerInfo): ValidationErrors => {
  const errors = {
    name: validatePayerInfo('name', payerInfo.name),
    email: validatePayerInfo('email', payerInfo.email),
    relationship: validatePayerInfo('relationship', payerInfo.relationship)
  };

  return errors;
};

export const isPayerFormValid = (payerInfo: PayerInfo): boolean => {
  const errors = validatePayerForm(payerInfo);
  return !Object.values(errors).some(error => error !== undefined);
}; 