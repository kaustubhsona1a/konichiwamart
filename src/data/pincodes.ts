import { PincodeInfo } from '../types';

export const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  // Metro hubs
  '400001': { city: 'Mumbai', state: 'Maharashtra', days: 2 },
  '400050': { city: 'Bandra, Mumbai', state: 'Maharashtra', days: 2 },
  '400076': { city: 'Powai, Mumbai', state: 'Maharashtra', days: 2 },
  '110001': { city: 'Connaught Place, New Delhi', state: 'Delhi', days: 2 },
  '110016': { city: 'Hauz Khas, New Delhi', state: 'Delhi', days: 2 },
  '122002': { city: 'Gurugram', state: 'Haryana', days: 2 },
  '560001': { city: 'MG Road, Bengaluru', state: 'Karnataka', days: 2 },
  '560034': { city: 'Koramangala, Bengaluru', state: 'Karnataka', days: 2 },
  '560038': { city: 'Indiranagar, Bengaluru', state: 'Karnataka', days: 2 },
  '500001': { city: 'Hyderabad', state: 'Telangana', days: 3 },
  '500081': { city: 'HITEC City, Hyderabad', state: 'Telangana', days: 3 },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', days: 3 },
  '600028': { city: 'R.A Puram, Chennai', state: 'Tamil Nadu', days: 3 },
  '700001': { city: 'Kolkata', state: 'West Bengal', days: 3 },
  '411001': { city: 'Pune', state: 'Maharashtra', days: 2 },
  '411014': { city: 'Viman Nagar, Pune', state: 'Maharashtra', days: 2 },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', days: 3 },
  '302001': { city: 'Jaipur', state: 'Rajasthan', days: 3 },
  '160017': { city: 'Chandigarh', state: 'Chandigarh', days: 2 },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh', days: 3 },
  '682001': { city: 'Kochi', state: 'Kerala', days: 3 },
  '452001': { city: 'Indore', state: 'Madhya Pradesh', days: 3 }
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

  // Fallback for valid 6-digit Indian pincode format
  if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
    const firstDigit = cleanPin[0];
    let defaultState = 'India';
    let defaultCity = 'Regional Hub';
    let days = 4;

    if (firstDigit === '1' || firstDigit === '2') {
      defaultState = 'Northern Region';
      defaultCity = 'NCR & North Hub';
      days = 3;
    } else if (firstDigit === '3' || firstDigit === '4') {
      defaultState = 'Western Region';
      defaultCity = 'West Central Hub';
      days = 3;
    } else if (firstDigit === '5' || firstDigit === '6') {
      defaultState = 'Southern Region';
      defaultCity = 'South Central Hub';
      days = 3;
    } else if (firstDigit === '7' || firstDigit === '8') {
      defaultState = 'Eastern Region';
      defaultCity = 'East Hub';
      days = 4;
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
