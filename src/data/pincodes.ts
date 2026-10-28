import { PincodeInfo } from '../types';

export const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  // Metro hubs & Dispatch Center
  '400093': { city: 'Andheri East, Mumbai', state: 'Maharashtra', days: 5 },
  '400001': { city: 'Mumbai', state: 'Maharashtra', days: 5 },
  '400050': { city: 'Bandra, Mumbai', state: 'Maharashtra', days: 5 },
  '400076': { city: 'Powai, Mumbai', state: 'Maharashtra', days: 5 },
  '110001': { city: 'Connaught Place, New Delhi', state: 'Delhi', days: 5 },
  '110005': { city: 'Karol Bagh, New Delhi', state: 'Delhi', days: 5 },
  '110016': { city: 'Hauz Khas, New Delhi', state: 'Delhi', days: 5 },
  '122002': { city: 'Gurugram', state: 'Haryana', days: 5 },
  '122017': { city: 'Palam Vihar, Gurugram', state: 'Haryana', days: 5 },
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

export function resolveIndianStateAndCityFromPincode(pincode: string): { city: string; state: string; days: number } {
  const cleanPin = (pincode || '').trim().replace(/\D/g, '');
  if (PINCODE_DATABASE[cleanPin]) {
    return PINCODE_DATABASE[cleanPin];
  }

  const prefix2 = cleanPin.slice(0, 2);
  const prefix3 = cleanPin.slice(0, 3);

  if (prefix3 === '403') return { city: 'Panaji', state: 'Goa', days: 5 };
  if (prefix3 === '201') return { city: 'Noida', state: 'Uttar Pradesh', days: 5 };
  if (prefix3 === '121') return { city: 'Faridabad', state: 'Haryana', days: 5 };
  if (prefix3 === '122') return { city: 'Gurugram', state: 'Haryana', days: 5 };

  const prefixMap: Record<string, { city: string; state: string; days: number }> = {
    '11': { city: 'New Delhi', state: 'Delhi', days: 5 },
    '12': { city: 'Gurugram', state: 'Haryana', days: 5 },
    '13': { city: 'Ambala', state: 'Haryana', days: 5 },
    '14': { city: 'Ludhiana', state: 'Punjab', days: 5 },
    '15': { city: 'Bathinda', state: 'Punjab', days: 5 },
    '16': { city: 'Chandigarh', state: 'Chandigarh', days: 5 },
    '17': { city: 'Shimla', state: 'Himachal Pradesh', days: 6 },
    '18': { city: 'Jammu', state: 'Jammu and Kashmir', days: 6 },
    '19': { city: 'Srinagar', state: 'Jammu and Kashmir', days: 6 },
    '20': { city: 'Noida', state: 'Uttar Pradesh', days: 5 },
    '21': { city: 'Prayagraj', state: 'Uttar Pradesh', days: 6 },
    '22': { city: 'Lucknow', state: 'Uttar Pradesh', days: 6 },
    '23': { city: 'Varanasi', state: 'Uttar Pradesh', days: 6 },
    '24': { city: 'Dehradun', state: 'Uttarakhand', days: 6 },
    '25': { city: 'Meerut', state: 'Uttar Pradesh', days: 5 },
    '26': { city: 'Bareilly', state: 'Uttar Pradesh', days: 6 },
    '27': { city: 'Gorakhpur', state: 'Uttar Pradesh', days: 6 },
    '28': { city: 'Agra', state: 'Uttar Pradesh', days: 5 },
    '30': { city: 'Jaipur', state: 'Rajasthan', days: 5 },
    '31': { city: 'Udaipur', state: 'Rajasthan', days: 6 },
    '32': { city: 'Kota', state: 'Rajasthan', days: 6 },
    '33': { city: 'Bikaner', state: 'Rajasthan', days: 6 },
    '34': { city: 'Jodhpur', state: 'Rajasthan', days: 6 },
    '36': { city: 'Rajkot', state: 'Gujarat', days: 5 },
    '37': { city: 'Bhuj', state: 'Gujarat', days: 6 },
    '38': { city: 'Ahmedabad', state: 'Gujarat', days: 5 },
    '39': { city: 'Surat', state: 'Gujarat', days: 5 },
    '40': { city: 'Mumbai', state: 'Maharashtra', days: 4 },
    '41': { city: 'Pune', state: 'Maharashtra', days: 5 },
    '42': { city: 'Nashik', state: 'Maharashtra', days: 5 },
    '43': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', days: 5 },
    '44': { city: 'Nagpur', state: 'Maharashtra', days: 5 },
    '45': { city: 'Indore', state: 'Madhya Pradesh', days: 5 },
    '46': { city: 'Bhopal', state: 'Madhya Pradesh', days: 5 },
    '47': { city: 'Gwalior', state: 'Madhya Pradesh', days: 6 },
    '48': { city: 'Jabalpur', state: 'Madhya Pradesh', days: 6 },
    '49': { city: 'Raipur', state: 'Chhattisgarh', days: 6 },
    '50': { city: 'Hyderabad', state: 'Telangana', days: 5 },
    '51': { city: 'Tirupati', state: 'Andhra Pradesh', days: 6 },
    '52': { city: 'Vijayawada', state: 'Andhra Pradesh', days: 6 },
    '53': { city: 'Visakhapatnam', state: 'Andhra Pradesh', days: 6 },
    '56': { city: 'Bengaluru', state: 'Karnataka', days: 5 },
    '57': { city: 'Mysuru', state: 'Karnataka', days: 6 },
    '58': { city: 'Hubballi', state: 'Karnataka', days: 6 },
    '59': { city: 'Belagavi', state: 'Karnataka', days: 6 },
    '60': { city: 'Chennai', state: 'Tamil Nadu', days: 5 },
    '61': { city: 'Thanjavur', state: 'Tamil Nadu', days: 6 },
    '62': { city: 'Madurai', state: 'Tamil Nadu', days: 6 },
    '63': { city: 'Salem', state: 'Tamil Nadu', days: 6 },
    '64': { city: 'Coimbatore', state: 'Tamil Nadu', days: 6 },
    '67': { city: 'Kozhikode', state: 'Kerala', days: 6 },
    '68': { city: 'Kochi', state: 'Kerala', days: 6 },
    '69': { city: 'Thiruvananthapuram', state: 'Kerala', days: 6 },
    '70': { city: 'Kolkata', state: 'West Bengal', days: 5 },
    '71': { city: 'Howrah', state: 'West Bengal', days: 6 },
    '72': { city: 'Kharagpur', state: 'West Bengal', days: 6 },
    '73': { city: 'Siliguri', state: 'West Bengal', days: 6 },
    '74': { city: 'Nadia', state: 'West Bengal', days: 6 },
    '75': { city: 'Bhubaneswar', state: 'Odisha', days: 6 },
    '76': { city: 'Rourkela', state: 'Odisha', days: 6 },
    '77': { city: 'Sambalpur', state: 'Odisha', days: 6 },
    '78': { city: 'Guwahati', state: 'Assam', days: 7 },
    '79': { city: 'Shillong', state: 'Meghalaya', days: 7 },
    '80': { city: 'Patna', state: 'Bihar', days: 6 },
    '81': { city: 'Bhagalpur', state: 'Bihar', days: 6 },
    '82': { city: 'Gaya', state: 'Bihar', days: 6 },
    '83': { city: 'Ranchi', state: 'Jharkhand', days: 6 },
    '84': { city: 'Muzaffarpur', state: 'Bihar', days: 6 },
    '85': { city: 'Purnia', state: 'Bihar', days: 6 }
  };

  if (prefixMap[prefix2]) {
    return prefixMap[prefix2];
  }

  return { city: 'Mumbai', state: 'Maharashtra', days: 6 };
}

export function lookupPincode(pincode: string): PincodeInfo {
  const cleanPin = (pincode || '').trim().replace(/\D/g, '');
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
    const resolved = resolveIndianStateAndCityFromPincode(cleanPin);
    return {
      pincode: cleanPin,
      city: resolved.city,
      state: resolved.state,
      isServiceable: true,
      estimatedDays: resolved.days,
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
