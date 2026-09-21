export type SkinType = 'All' | 'Dry' | 'Oily' | 'Sensitive' | 'Combination' | 'Mature' | 'Normal';
export type SkinConcern = 'Hydration' | 'Glow & Dullness' | 'Barrier Repair' | 'Anti-Aging' | 'Blemishes & Texture' | 'Redness Relief';
export type ProductCategory = 'All' | 'Face Wash' | 'Face Mask' | 'Toner' | 'Sunscreen' | 'Lips' | 'Face' | 'Serum' | 'Skincare' | (string & {});

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ProductShade {
  id: string;
  name: string;
  hex: string;
  textColor?: string;
  sku?: string;
  image?: string;
  price?: number;
}

export interface Product {
  id: string;
  dbId?: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  category: ProductCategory;
  skinTypes: SkinType[];
  skinConcerns: SkinConcern[];
  routine: 'AM' | 'PM' | 'AM/PM';
  volume: string;
  badges: string[];
  image: string;
  secondaryImage?: string;
  images?: string[];
  accentColor: string;
  bgGradient: string;
  keyActives: { name: string; percentage?: string; purpose: string }[];
  fullIngredients: string;
  description: string;
  benefits: string[];
  usageHowTo: string;
  shades?: ProductShade[];
  isBestSeller?: boolean;
  isNew?: boolean;
  isComingSoon?: boolean;
  stock: number;
  displayOrder?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: ProductShade;
}

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  tag: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  volume: string;
  price: number;
  quantity: number;
  shade?: string;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  date: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  shippingFee: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'COD' | 'RAZORPAY_ONLINE';
  paymentId: string;
  signature: string;
  status: 'CONFIRMED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: UserAddress;
  awbNumber: string;
  courierPartner: string;
  estimatedDeliveryDate: string;
  trackingHistory: {
    time: string;
    location: string;
    activity: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: UserAddress[];
  wishlistIds: string[];
  orders: Order[];
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  state: string;
  isServiceable: boolean;
  estimatedDays: number;
  codAvailable: boolean;
  couriers: string[];
}

export interface SiteSettings {
  logoUrl?: string;
  storeName: string;
  storeTagline: string;
  heroBannerUrl: string;
  mobileHeroBannerUrl?: string;
  heroVideoUrl?: string;
  heroMobileVideoUrl?: string;
  heroMediaType?: 'image' | 'video';
  backgroundImageUrl?: string;
  mobileBackgroundImageUrl?: string;
  backgroundHintOpacity?: 'subtle' | 'balanced' | 'pronounced';
  flowerDriftEnabled: boolean;
  flowerDriftSpeed: 'still' | 'gentle' | 'fresh' | 'vibrant';
  flowerDriftDensity: 'low' | 'medium' | 'high';
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  verified: boolean;
  productId?: string;
  productName?: string;
  skinType?: string;
  headline: string;
  comment: string;
  helpfulCount: number;
}

export interface ReelItem {
  id: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatar: string;
  location: string;
  title: string;
  caption: string;
  views: string;
  likes: number;
  commentsCount: number;
  audioTrack: string;
  productId: string;
  videoThumb: string;
  videoUrl?: string;
  instagramUrl?: string;
  tags: string[];
}
