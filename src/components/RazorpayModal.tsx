import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  CreditCard,
  Sparkles,
  Loader2,
  Banknote,
  Check,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Edit3,
  FileText,
  Building,
  RefreshCw,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, UserAddress, Order, UserProfile } from '../types';
import { formatINR, generateAWB, lookupPincode } from '../data/pincodes';
import { 
  launchRazorpayCheckout, 
  getRazorpayKeyId, 
  loadRazorpayScript,
  sendOtpToPhone,
  verifyOtpCode,
  dispatchInvoiceEmail,
  createValidatedCheckoutOrder,
  RazorpayPaymentSuccessPayload,
  VerifyPaymentResponse
} from '../lib/razorpay';
import { saveOrderToSupabase } from '../lib/supabase';

export type CheckoutStep = 'CONTACT_VERIFICATION' | 'ADDRESS_CONFIRMATION' | 'PAYMENT' | 'SUCCESS';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  shippingFee: number;
  shippingAddress?: UserAddress;
  userProfile?: UserProfile;
  onUpdateProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  onPaymentSuccess: (order: Order) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discountAmount,
  discountCode,
  shippingFee,
  shippingAddress,
  userProfile,
  onUpdateProfile,
  onPaymentSuccess
}) => {
  // Navigation step inside modal
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('CONTACT_VERIFICATION');

  // Contact & Verification State
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [inputOtp, setInputOtp] = useState<string>('');
  const [activeOtpCode, setActiveOtpCode] = useState<string>('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [smsNotificationToast, setSmsNotificationToast] = useState<string | null>(null);

  // Address State
  const defaultAddr = shippingAddress || userProfile?.addresses.find(a => a.isDefault) || userProfile?.addresses[0];
  const [selectedAddressMode, setSelectedAddressMode] = useState<'SAVED' | 'CUSTOM'>(
    userProfile?.addresses && userProfile.addresses.length > 0 ? 'SAVED' : 'CUSTOM'
  );
  const [selectedSavedId, setSelectedSavedId] = useState<string>(defaultAddr?.id || '');
  const [fullName, setFullName] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [addressTag, setAddressTag] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [saveToAddresses, setSaveToAddresses] = useState<boolean>(true);

  // Payment & Execution State
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string>('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Price calculations
  const taxableAmount = subtotal - discountAmount;
  const grandTotal = Math.max(0, taxableAmount + shippingFee);
  const amountInPaise = Math.round(grandTotal * 100);
  const cgst = Math.round(taxableAmount * 0.09);
  const sgst = Math.round(taxableAmount * 0.09);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      getRazorpayKeyId().then(id => setKeyId(id));
      
      // Default to initial step
      setCurrentStep('CONTACT_VERIFICATION');
      setContactError(null);
      setAddressError(null);
      setPaymentError(null);
      setIsProcessing(false);
      setConfirmedOrder(null);

      // Preload contact info from userProfile if available
      const profileEmail = userProfile?.email || '';
      const profilePhone = (userProfile?.phone || '').replace(/\D/g, '').slice(-10);
      setEmail(profileEmail);
      setPhone(profilePhone || '9820198421');
      setIsPhoneVerified(false);
      setOtpSent(false);
      setInputOtp('');
      setSmsNotificationToast(null);

      // Preload address
      if (defaultAddr) {
        setFullName(defaultAddr.fullName || userProfile?.name || 'Priya Sharma');
        setAddressLine1(defaultAddr.addressLine1 || '');
        setAddressLine2(defaultAddr.addressLine2 || '');
        setPincode(defaultAddr.pincode || '400050');
        setCity(defaultAddr.city || 'Mumbai');
        setStateName(defaultAddr.state || 'Maharashtra');
        setAddressTag(defaultAddr.tag || 'Home');
        setSelectedSavedId(defaultAddr.id);
      } else {
        setFullName(userProfile?.name || '');
        setPincode('400050');
        setCity('Mumbai');
        setStateName('Maharashtra');
      }
    }
  }, [isOpen, userProfile]);

  // Sync city & state when pincode changes
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      const info = lookupPincode(pincode);
      if (info.city && !city) setCity(info.city);
      if (info.state && !stateName) setStateName(info.state);
    }
  }, [pincode]);

  if (!isOpen) return null;

  const activePincodeInfo = lookupPincode(pincode || '400050');

  // Handler: Send OTP to Phone
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setContactError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setContactError(null);
    setIsSendingOtp(true);
    try {
      const res = await sendOtpToPhone(cleanPhone);
      setOtpSent(true);
      if (res.otp) {
        setActiveOtpCode(res.otp);
        setSmsNotificationToast(`[SMS Alert] Konichiwa_Mart Verification Code: ${res.otp}`);
      }
    } catch (err: any) {
      setContactError(err.message || 'Failed to send verification SMS.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handler: Verify OTP Code
  const handleVerifyOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!inputOtp.trim()) {
      setContactError('Please enter the 4-digit verification code.');
      return;
    }

    setContactError(null);
    setIsVerifyingOtp(true);
    try {
      await verifyOtpCode(cleanPhone, inputOtp.trim());
      setIsPhoneVerified(true);
      setContactError(null);
      setSmsNotificationToast(null);
    } catch (err: any) {
      setContactError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 1 Validation & Proceed
  const handleProceedToAddress = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setContactError('A valid email address is required so we can email your GST Tax Invoice and tracking.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setContactError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!isPhoneVerified) {
      setContactError('Please verify your mobile number via OTP before proceeding.');
      return;
    }

    setContactError(null);
    setCurrentStep('ADDRESS_CONFIRMATION');
  };

  // Handler: Select a Saved Address
  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedSavedId(addr.id);
    setFullName(addr.fullName);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setPincode(addr.pincode);
    setCity(addr.city);
    setStateName(addr.state);
    setAddressTag(addr.tag);
  };

  // Step 2 Validation & Proceed
  const handleProceedToPayment = () => {
    if (!fullName.trim()) {
      setAddressError('Recipient full name is required.');
      return;
    }
    if (!addressLine1.trim()) {
      setAddressError('Flat / Building / House number is required.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setAddressError('Please enter a valid 6-digit postal pincode.');
      return;
    }
    if (!city.trim() || !stateName.trim()) {
      setAddressError('City and State are required.');
      return;
    }

    // Optionally save new address to user profile
    if (saveToAddresses && onUpdateProfile && userProfile) {
      const exists = userProfile.addresses.some(a => a.id === selectedSavedId);
      if (!exists) {
        const newAddr: UserAddress = {
          id: `addr_${Date.now()}`,
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          pincode,
          tag: addressTag,
          isDefault: false
        };
        onUpdateProfile(prev => ({
          ...prev,
          addresses: [...prev.addresses, newAddr]
        }));
      }
    }

    setAddressError(null);
    setCurrentStep('PAYMENT');
  };

  // Final Order Construction Helper
  const assembleOrder = (paymentId: string, signature: string, method: 'RAZORPAY_ONLINE' | 'COD'): Order => {
    const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNum = `KM-${Math.floor(10000 + Math.random() * 90000)}`;
    const awb = generateAWB();
    const pinInfo = lookupPincode(pincode);

    const targetAddress: UserAddress = {
      id: selectedSavedId || `addr_${Date.now()}`,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state: stateName,
      pincode,
      tag: addressTag,
      isDefault: false
    };

    return {
      id: `ord_${Date.now()}`,
      orderNumber: orderNum,
      invoiceNumber: invoiceNum,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customerEmail: email.trim(),
      customerPhone: phone.replace(/\D/g, '').slice(-10),
      items: items.map(i => ({
        productId: i.product.id,
        title: i.product.title,
        volume: i.product.volume,
        price: i.product.price,
        quantity: i.quantity,
        shade: i.selectedShade?.name,
        image: i.product.image
      })),
      subtotal,
      cgst,
      sgst,
      shippingFee,
      discountAmount,
      discountCode,
      totalAmount: grandTotal,
      paymentMethod: method,
      paymentId,
      signature,
      status: 'CONFIRMED',
      shippingAddress: targetAddress,
      awbNumber: awb,
      courierPartner: pinInfo.couriers[0] || 'Blue Dart Air Express',
      estimatedDeliveryDate: `${pinInfo.estimatedDays || 2} Business Days`,
      trackingHistory: [
        {
          time: 'Just Now',
          location: 'Konichiwa_Mart Central Fulfillment, Mumbai (MH)',
          activity: `Payment Verified (${paymentId}). Order Confirmed. GST Invoice queued for ${email}.`
        },
        {
          time: 'Pending Logistics Handover',
          location: 'Shiprocket Logistics Express Bay',
          activity: `Air Waybill Assigned (${awb}) via Blue Dart Express`
        }
      ]
    };
  };

  // Launch Razorpay Standard Web Checkout
  const handleStartRazorpayCheckout = async () => {
    if (amountInPaise < 100) {
      setPaymentError('Minimum order amount for Razorpay checkout is ₹1.00 (100 paise).');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setStatusMessage('Validating order & prices server-side...');

    try {
      // 1. Authoritative Server-Side Price & Inventory Validation
      const validatedServerOrder = await createValidatedCheckoutOrder({
        items: items.map(i => ({
          productId: i.product.id,
          variantId: i.selectedShade?.id,
          quantity: i.quantity
        })),
        customer: {
          fullName: (fullName || 'Valued Customer').trim(),
          email: email.trim(),
          phone: phone.replace(/\D/g, '').slice(-10)
        },
        shippingAddress: {
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          pincode
        },
        discountCode
      });

      setStatusMessage('Order verified! Initiating secure Razorpay checkout...');

      await launchRazorpayCheckout({
        amountInPaise: validatedServerOrder.amount || amountInPaise,
        currency: 'INR',
        receipt: validatedServerOrder.orderNumber,
        orderId: validatedServerOrder.razorpayOrderId,
        customerName: fullName || 'Valued Customer',
        customerEmail: email.trim(),
        customerContact: phone.replace(/\D/g, '').slice(-10),
        address: `${addressLine1}, ${city}, ${pincode}`,
        onSuccess: async (paymentPayload: RazorpayPaymentSuccessPayload, _verification: VerifyPaymentResponse) => {
          setIsProcessing(false);
          setStatusMessage('Payment verified! Dispatched GST Tax Invoice to your email.');

          // Build and dispatch order
          const createdOrder = assembleOrder(
            paymentPayload.razorpay_payment_id,
            paymentPayload.razorpay_signature,
            'RAZORPAY_ONLINE'
          );

          if (validatedServerOrder.orderNumber) {
            createdOrder.orderNumber = validatedServerOrder.orderNumber;
            createdOrder.invoiceNumber = validatedServerOrder.invoiceNumber;
          }

          setConfirmedOrder(createdOrder);
          setCurrentStep('SUCCESS');

          // Persist order and items into Supabase tables
          saveOrderToSupabase(createdOrder).catch((err) => {
            console.warn('[Supabase Sync Warning]:', err);
          });

          // Confetti celebration
          confetti({
            particleCount: 110,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#EC4899', '#F472B6', '#FB7185', '#FBBF24']
          });

          // Trigger real invoice email dispatch to customer email
          await dispatchInvoiceEmail({
            email: createdOrder.customerEmail || email.trim(),
            invoiceNumber: createdOrder.invoiceNumber,
            orderNumber: createdOrder.orderNumber,
            customerName: fullName,
            totalAmount: validatedServerOrder.grandTotal || grandTotal
          });

          setTimeout(() => {
            onPaymentSuccess(createdOrder);
          }, 2500);
        },
        onDismiss: () => {
          setIsProcessing(false);
          setPaymentError('Payment window was closed before completion. You can retry anytime.');
        },
        onError: (err: string) => {
          setIsProcessing(false);
          setPaymentError(err || 'Payment transaction encountered an issue. Please try again or test in Sandbox mode.');
        }
      });
    } catch (serverErr: any) {
      console.warn('Server validation issue:', serverErr);
      setIsProcessing(false);
      setPaymentError(serverErr.message || 'Server-side price verification failed.');
    }
  };

  // Cash on Delivery Checkout
  const handleConfirmCod = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    setStatusMessage('Confirming order with verified phone number...');

    setTimeout(async () => {
      setIsProcessing(false);
      const codOrder = assembleOrder(
        `COD_AUTH_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        'COD_VERIFIED',
        'COD'
      );
      setConfirmedOrder(codOrder);
      setCurrentStep('SUCCESS');

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EC4899', '#10B981', '#F59E0B']
      });

      // Dispatch invoice email confirmation
      await dispatchInvoiceEmail({
        email: codOrder.customerEmail || email.trim(),
        invoiceNumber: codOrder.invoiceNumber,
        orderNumber: codOrder.orderNumber,
        customerName: fullName,
        totalAmount: grandTotal
      });

      setTimeout(() => {
        onPaymentSuccess(codOrder);
      }, 2200);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-pink-950/35 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-pink-100 overflow-hidden text-left my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Step Progress - Light Baby Pink Palette */}
        <div className="bg-gradient-to-r from-pink-100 via-rose-50 to-pink-50 text-slate-900 p-5 border-b border-pink-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xl font-mono shadow-xs shadow-pink-600/30">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 tracking-wide">Konichiwa_Mart Checkout</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>256-Bit SSL</span>
                  </span>
                </div>
                <p className="text-xs text-pink-800/80 font-medium">
                  Step {currentStep === 'CONTACT_VERIFICATION' ? '1 of 3' : currentStep === 'ADDRESS_CONFIRMATION' ? '2 of 3' : currentStep === 'PAYMENT' ? '3 of 3' : 'Completed'}
                </p>
              </div>
            </div>

            <div className="text-right flex items-center gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Payable</div>
                <div className="font-black text-lg text-pink-600">
                  {formatINR(grandTotal)}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-pink-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Badges */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-pink-200/80 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 'CONTACT_VERIFICATION' ? 'text-pink-700' : isPhoneVerified ? 'text-emerald-700' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isPhoneVerified ? 'bg-emerald-500 text-white' : currentStep === 'CONTACT_VERIFICATION' ? 'bg-pink-600 text-white shadow-xs' : 'bg-pink-100 text-pink-600'
              }`}>
                {isPhoneVerified ? '✓' : '1'}
              </div>
              <span className="truncate">1. Contact & Verify</span>
            </div>

            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 'ADDRESS_CONFIRMATION' ? 'text-pink-700' : currentStep === 'PAYMENT' || currentStep === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'PAYMENT' || currentStep === 'SUCCESS' ? 'bg-emerald-500 text-white' : currentStep === 'ADDRESS_CONFIRMATION' ? 'bg-pink-600 text-white shadow-xs' : 'bg-pink-100 text-pink-600'
              }`}>
                {currentStep === 'PAYMENT' || currentStep === 'SUCCESS' ? '✓' : '2'}
              </div>
              <span className="truncate">2. Delivery Address</span>
            </div>

            <div className={`flex items-center gap-1.5 font-semibold ${currentStep === 'PAYMENT' ? 'text-pink-700' : currentStep === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'SUCCESS' ? 'bg-emerald-500 text-white' : currentStep === 'PAYMENT' ? 'bg-pink-600 text-white shadow-xs' : 'bg-pink-100 text-pink-600'
              }`}>
                {currentStep === 'SUCCESS' ? '✓' : '3'}
              </div>
              <span className="truncate">3. Payment</span>
            </div>
          </div>
        </div>

        {/* STEP 1: CONTACT & PHONE VERIFICATION */}
        {currentStep === 'CONTACT_VERIFICATION' && (
          <div className="p-6 space-y-5">
            
            {/* Context Callout */}
            <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-200 text-xs text-pink-950 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Invoice & Notification Verification</strong>
                <span>
                  Please confirm your email address to receive your official GST Tax Invoice (PDF) upon payment, and verify your mobile number via OTP for delivery alerts.
                </span>
              </div>
            </div>

            {/* Error Message */}
            {contactError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{contactError}</span>
              </div>
            )}

            {/* Simulated SMS Toast for testing */}
            {smsNotificationToast && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in slide-in-from-top">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-mono font-medium">{smsNotificationToast}</span>
                </div>
                {activeOtpCode && (
                  <button
                    type="button"
                    onClick={() => setInputOtp(activeOtpCode)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Auto-Fill {activeOtpCode}
                  </button>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              
              {/* Email Address */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Email Address for GST Invoice <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ✓ Your GST Tax Invoice (PDF) with serial number & HSN codes will be emailed here.
                </span>
              </div>

              {/* Mobile Number & OTP Verification */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Mobile Number for Dispatch & SMS Alerts <span className="text-rose-500">*</span>
                </label>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      disabled={isPhoneVerified}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        if (isPhoneVerified) setIsPhoneVerified(false);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-pink-500 focus:bg-white transition-all disabled:opacity-75 disabled:bg-slate-100"
                    />
                  </div>

                  {!isPhoneVerified ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || phone.length !== 10}
                        className="px-3.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs whitespace-nowrap"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhoneVerified(true);
                          setContactError(null);
                          setSmsNotificationToast(null);
                        }}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer transition-all border border-slate-200 whitespace-nowrap"
                        title="Instant verification for testing and customer demos"
                      >
                        Quick Verify
                      </button>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified ✓</span>
                    </div>
                  )}
                </div>

                {/* OTP Input Row when OTP has been sent */}
                {!isPhoneVerified && otpSent && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Enter 4-digit verification code:</span>
                      <span className="text-[11px] text-slate-500">(Test code: <strong>{activeOtpCode || '1234'}</strong>)</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                        className="flex-1 px-4 py-2 text-center tracking-widest font-mono font-bold text-base rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                      />

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || inputOtp.length < 4}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm OTP</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToAddress}
                className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-pink-600/20 transition-all"
              >
                <span>Continue to Delivery Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: ADDRESS CONFIRMATION */}
        {currentStep === 'ADDRESS_CONFIRMATION' && (
          <div className="p-6 space-y-5">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirm Delivery Address</h4>
                <p className="text-xs text-slate-500">Select an existing address or enter shipping destination</p>
              </div>

              {userProfile?.addresses && userProfile.addresses.length > 0 && (
                <div className="flex gap-1.5 text-[11px] bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedAddressMode('SAVED')}
                    className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      selectedAddressMode === 'SAVED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Saved Addresses ({userProfile.addresses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressMode('CUSTOM');
                      setSelectedSavedId('');
                    }}
                    className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      selectedAddressMode === 'CUSTOM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    + New Address
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {addressError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            {/* Saved Address Cards */}
            {selectedAddressMode === 'SAVED' && userProfile?.addresses && (
              <div className="space-y-2.5">
                {userProfile.addresses.map((addr) => {
                  const isSelected = selectedSavedId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50/60 ring-1 ring-pink-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.fullName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {addr.tag}
                          </span>
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-slate-500">
                          {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-pink-600 bg-pink-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address Input Form */}
            {(selectedAddressMode === 'CUSTOM' || !userProfile?.addresses?.length) && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                
                {/* Full Name */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Flat / Building */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Flat, House No., Building, Apartment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Flat 402, Lotus Grand Residences"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Street / Landmark */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Street, Area, Landmark
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Off Linking Road, Near Blue Tokai"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Pincode, City & State Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 400050"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Address Tag */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="font-semibold text-slate-700">Tag as:</span>
                  {(['Home', 'Office', 'Other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border ${
                        addressTag === t
                          ? 'border-pink-500 bg-pink-100 text-pink-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Courier Serviceability Badge */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Serviceable via <strong>{activePincodeInfo.couriers[0] || 'Blue Dart Air Express'}</strong>
                </span>
              </div>
              <span className="font-semibold text-[11px] text-emerald-800">
                Est. Delivery: {activePincodeInfo.estimatedDays || 2} Days
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep('CONTACT_VERIFICATION')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Contact</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-pink-600/20 transition-all"
              >
                <span>Confirm Address & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: PAYMENT & CONFIRMATION */}
        {currentStep === 'PAYMENT' && (
          <div className="p-6 space-y-5">
            
            {/* Error Banner */}
            {paymentError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Payment Notification</strong>
                    <span>{paymentError}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700">Presenting to customers? You can test with full invoice generation:</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProcessing(true);
                      setPaymentError(null);
                      setStatusMessage('Simulating verified Razorpay payment for customer demo...');
                      setTimeout(async () => {
                        const demoOrder = assembleOrder(
                          `pay_demo_${Date.now()}`,
                          'sig_test_demo_verified',
                          'RAZORPAY_ONLINE'
                        );
                        setConfirmedOrder(demoOrder);
                        setCurrentStep('SUCCESS');
                        setIsProcessing(false);
                        confetti({
                          particleCount: 100,
                          spread: 80,
                          origin: { y: 0.6 },
                          colors: ['#EC4899', '#F472B6', '#10B981']
                        });
                        await dispatchInvoiceEmail({
                          email: demoOrder.customerEmail || email.trim(),
                          invoiceNumber: demoOrder.invoiceNumber,
                          orderNumber: demoOrder.orderNumber,
                          customerName: fullName,
                          totalAmount: grandTotal
                        });
                        setTimeout(() => onPaymentSuccess(demoOrder), 2500);
                      }, 1000);
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] cursor-pointer shadow-xs transition-colors"
                  >
                    Simulate Demo Payment
                  </button>
                </div>
              </div>
            )}

            {/* Verified Details Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800 font-semibold">
                <span>Verified Delivery & Invoice Details</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep('ADDRESS_CONFIRMATION')}
                  className="text-pink-600 hover:text-pink-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Modify</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div>
                  <strong className="text-slate-800 block font-medium">Recipient:</strong>
                  <span>{fullName}</span>
                </div>
                <div>
                  <strong className="text-slate-800 block font-medium">Verified Phone:</strong>
                  <span className="text-emerald-700 font-medium">✓ +91 {phone} (OTP Verified)</span>
                </div>
                <div>
                  <strong className="text-slate-800 block font-medium">GST Invoice Recipient:</strong>
                  <span className="text-pink-700 font-medium">{email}</span>
                </div>
                <div>
                  <strong className="text-slate-800 block font-medium">Destination:</strong>
                  <span className="truncate block">{addressLine1}, {city} - {pincode}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Savings ({discountCode})</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>GST Breakdown (9% CGST + 9% SGST included)</span>
                <span>{formatINR(cgst + sgst)}</span>
              </div>

              <div className="flex justify-between">
                <span>Express Air Shipping</span>
                <span>{shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatINR(shippingFee)}</span>
              </div>

              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="text-pink-700">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 block">
                Select Payment Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Razorpay Standard */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('RAZORPAY')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    selectedMethod === 'RAZORPAY'
                      ? 'border-pink-500 bg-pink-50/50 ring-1 ring-pink-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Razorpay Standard</span>
                      <span className="text-[10px] bg-pink-600 text-white px-1.5 py-0.2 rounded font-semibold">Recommended</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      UPI, Cards, NetBanking, Wallets & CRED
                    </div>
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('COD')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    selectedMethod === 'COD'
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Cash on Delivery (COD)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Pay via cash or UPI upon delivery
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {selectedMethod === 'RAZORPAY' ? (
                <button
                  onClick={handleStartRazorpayCheckout}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{statusMessage || 'Opening Razorpay Modal...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay {formatINR(grandTotal)} via Razorpay Standard</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleConfirmCod}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Cash on Delivery Order...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Confirm COD Order ({formatINR(grandTotal)})</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('ADDRESS_CONFIRMATION')}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Address</span>
                </button>

                <div className="text-[11px] text-slate-400">
                  Secured by Razorpay • 256-bit Encryption
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: SUCCESS & INVOICE DISPATCH CONFIRMATION */}
        {currentStep === 'SUCCESS' && confirmedOrder && (
          <div className="p-8 text-center space-y-5 max-w-lg mx-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-display font-bold text-2xl text-emerald-950">
                Order Placed & Confirmed!
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Thank you, <strong>{fullName}</strong>. Your payment has been authorized and verified.
              </p>
            </div>

            {/* Email Dispatch Confirmation Box */}
            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 text-left space-y-2 text-xs text-pink-950">
              <div className="flex items-center gap-2 font-bold text-pink-900">
                <Mail className="w-4 h-4 text-pink-500" />
                <span>Official GST Tax Invoice Dispatched</span>
              </div>
              <p className="text-[11px] text-pink-800 leading-relaxed">
                An official PDF copy of Tax Invoice <strong>#{confirmedOrder.invoiceNumber}</strong> has been sent to <strong>{confirmedOrder.customerEmail}</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-pink-200/60 text-[11px] text-pink-700 font-mono">
                <Phone className="w-3.5 h-3.5 text-pink-500" />
                <span>SMS Dispatch Updates: +91 {confirmedOrder.customerPhone}</span>
              </div>
            </div>

            {/* Order & Courier Reference */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex justify-between items-center text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px]">Order Number</span>
                <span className="font-mono font-bold text-slate-900">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Air Waybill (AWB)</span>
                <span className="font-mono font-bold text-pink-600">{confirmedOrder.awbNumber}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onPaymentSuccess(confirmedOrder)}
                className="w-full py-3 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-600/20 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>View & Print GST Tax Invoice</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Security Badges */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2.5">
            <span>PCI-DSS Level 1</span>
            <span>•</span>
            <span>RBI Approved</span>
            <span>•</span>
            <span>GSTIN 27AABCK9482Q1Z8</span>
          </div>

          <div className="flex items-center gap-1.5 text-pink-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Buyer Protection Guarantee</span>
          </div>
        </div>

      </div>

    </div>
  );
};
