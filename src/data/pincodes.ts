import { PincodeInfo } from '../types';

export const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  // Metro hubs & Dispatch Center
  '400093': { city: 'Andheri East, Mumbai', state: 'Maharashtra', days: 5 },
  '400001': { city: 'Mumbai', state: 'Maharashtra', days: 5 },
  '400050': { city: 'Bandra, Mumbai', state: 'Maharashtra', days: 5 },
  '400076': { city: 'Powai, Mumbai', state: 'Maharashtra', days: 5 },
  '110001': { city: 'Connaught Place, New Delhi', state: 'Delhi', days: 5 },
  '110016': { city: 'Hauz Khas, New Delhi', state: 'Delhi', days: 5 },
  '122002': { city: 'Gurugram', state: 'Haryana', days: 5 },
  '560001': { city: 'MG Road, Bengaluru', state: 'Karnataka', days: 5 },
  '560034': { city: 'Koramangala, Bengaluru', state: 'Karnataka', days: 5 },
  '560038': { city: 'Indiranagar, Bengaluru', state: 'Karnataka', days: 5 },
  '500001': { city: 'Hyderabad', state: 'Telangana', days: 6 },
  '500081': { city: 'HITEC City, Hyderabad', state: 'Telangana', days: 6 },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', days: 6 },
  '600028': { city: 'R.A Puram, Chennai', state: 'Tamil Nadu', days: 6 },
  '700001': { city: 'Kolkata', state: 'West Bengal', days: 6 },
  '411001': { city: 'Pune', state: 'Maharashtra', days: 5 },
  '411014': { city: 'Viman Nagar, Pune', state: 'Maharashtra', days: 5 },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', days: 5 },
  '302001': { city: 'Jaipur', state: 'Rajasthan', days: 6 },
  '160017': { city: 'Chandigarh', state: 'Chandigarh', days: 5 },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh', days: 6 },
  '682001': { city: 'Kochi', state: 'Kerala', days: 6 },
  '452001': { city: 'Indore', state: 'Madhya Pradesh', days: 5 }
};

export function lookupPincode(pincode: string): PincodeInfo {
  const cleanPin = pincode.trim();
  if (PINCODE_DATABASE[cleanPin]) {
    const info = PINCODE_DATABASE[cleanPin];
    return {
      pincode: cleanPin,
      city: info.city,
      state: info.state,
      isServiceable: true,
      estimatedDays: info.days,
      codAvailable: true,
      couriers: ['Blue Dart Air Express', 'Delhivery Surface', 'DTDC Priority']
    };
  }

  // Fallback for valid 6-digit Indian pincode format (5-7 business days)
  if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
    const firstDigit = cleanPin[0];
    let defaultState = 'India';
    let defaultCity = 'Regional Hub';
    let days = 6;

    if (firstDigit === '1' || firstDigit === '2') {
      defaultState = 'Northern Region';
      defaultCity = 'NCR & North Hub';
      days = 5;
    } else if (firstDigit === '3' || firstDigit === '4') {
      defaultState = 'Western Region';
      defaultCity = 'West Central Hub';
      days = 5;
    } else if (firstDigit === '5' || firstDigit === '6') {
      defaultState = 'Southern Region';
      defaultCity = 'South Central Hub';
      days = 6;
    } else if (firstDigit === '7' || firstDigit === '8') {
      defaultState = 'Eastern Region';
      defaultCity = 'East Hub';
      days = 7;
    }

    return {
      pincode: cleanPin,
      city: defaultCity,
      state: defaultState,
      isServiceable: true,
      estimatedDays: days,
      codAvailable: true,
      couriers: ['Delhivery Logistics', 'DTDC Express', 'Shadowfax']
    };
  }

  return {
    pincode: cleanPin,
    city: '',
    state: '',
    isServiceable: false,
    estimatedDays: 0,
    codAvailable: false,
    couriers: []
  };
}

export function generateAWB(): string {
  const prefix = 'AWB-SR';
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${randomNum}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
