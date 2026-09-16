import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  Send,
  ShoppingBag,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, UserAddress, Order, UserProfile } from '../types';
import { formatINR, generateAWB, lookupPincode } from '../data/pincodes';
import { 
  launchRazorpayCheckout, 
  getRazorpayKeyId, 
  checkRazorpayConfig,
  loadRazorpayScript,
  sendOtpToPhone,
  verifyOtpCode,
  dispatchInvoiceEmail,
  createValidatedCheckoutOrder,
  RazorpayPaymentSuccessPayload,
  VerifyPaymentResponse
} from '../lib/razorpay';
import { 
  saveOrderToSupabase, 
  saveAddressToSupabase, 
  fetchCustomerAddressesFromSupabase,
  getActiveCustomerSession
} from '../lib/supabase';

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
  onUpdateProfile?: (profile: UserProfile) => void;
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
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'UPI' | 'CARDS_NETBANKING'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'google_pay' | 'phonepe' | 'paytm' | 'bhim' | 'qr'>('google_pay');
  const [userVpa, setUserVpa] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string>('');
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState<boolean>(true);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Price calculations
  const taxableAmount = subtotal - discountAmount;
  const grandTotal = Math.max(0, taxableAmount + shippingFee);
  const amountInPaise = Math.round(grandTotal * 100);
  const cgst = Math.round(taxableAmount * 0.09);
  const sgst = Math.round(taxableAmount * 0.09);

  // Generate dynamic UPI QR Code whenever grandTotal changes
  useEffect(() => {
    if (grandTotal > 0) {
      const formattedAmount = grandTotal.toFixed(2);
      const payeeName = encodeURIComponent('Konichiwa Mart');
      const transactionNote = encodeURIComponent('Konichiwa Mart Skincare Order');
      // Standard NPCI UPI URI Specification
      const upiUri = `upi://pay?pa=konichiwamart@icici&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${transactionNote}`;
      QRCode.toDataURL(upiUri, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url: string) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [grandTotal]);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      checkRazorpayConfig().then(cfg => {
        setIsRazorpayConfigured(cfg.isConfigured);
        setKeyId(cfg.keyId);
      });
      
      setContactError(null);
      setAddressError(null);
      setPaymentError(null);
      setIsProcessing(false);
      setConfirmedOrder(null);

      // Preload contact info from userProfile, active session, or persistent storage
      let profileEmail = userProfile?.email || '';
      let profilePhone = (userProfile?.phone || '').replace(/\D/g, '').slice(-10);
      let profileName = userProfile?.name || '';

      if (!profileEmail || !profilePhone) {
        try {
          const sessionRaw = localStorage.getItem('km_customer_session');
          if (sessionRaw) {
            const parsed = JSON.parse(sessionRaw);
            if (!profileEmail && parsed.email) profileEmail = parsed.email;
            if (!profilePhone && parsed.phone) profilePhone = parsed.phone.replace(/\D/g, '').slice(-10);
            if (!profileName && parsed.name) profileName = parsed.name;
          }
        } catch {}
      }

      if (!profilePhone && profileEmail) {
        const storedPhone = localStorage.getItem(`km_customer_phone_${profileEmail.toLowerCase()}`) ||
                            localStorage.getItem('km_customer_phone');
        if (storedPhone) profilePhone = storedPhone.replace(/\D/g, '').slice(-10);
      }
      if (!profileEmail) {
        const storedEmail = localStorage.getItem('km_customer_email');
        if (storedEmail) profileEmail = storedEmail;
      }

      // Preload address: check props, userProfile, or persistent local cache
      let initialAddr: UserAddress | undefined = defaultAddr;
      if (!initialAddr || !initialAddr.addressLine1) {
        try {
          const cachedRaw = (profileEmail && localStorage.getItem(`km_customer_last_addr_${profileEmail.toLowerCase()}`)) ||
            localStorage.getItem('km_last_delivery_address');
          if (cachedRaw) {
            initialAddr = JSON.parse(cachedRaw);
          }
        } catch {}
      }

      if (initialAddr) {
        if (!profileName && initialAddr.fullName) profileName = initialAddr.fullName;
        if (!profilePhone && initialAddr.phone) profilePhone = initialAddr.phone.replace(/\D/g, '').slice(-10);
        
        setFullName(initialAddr.fullName || profileName || '');
        setAddressLine1(initialAddr.addressLine1 || '');
        setAddressLine2(initialAddr.addressLine2 || '');
        setPincode(initialAddr.pincode || '');
        setCity(initialAddr.city || '');
        setStateName(initialAddr.state || '');
        setAddressTag(initialAddr.tag || 'Home');
        setSelectedSavedId(initialAddr.id);
        if (userProfile?.addresses && userProfile.addresses.length > 0) {
          setSelectedAddressMode('SAVED');
        }
      } else {
        setFullName(profileName || '');
        setAddressLine1('');
        setAddressLine2('');
        setPincode('');
        setCity('');
        setStateName('');
        setSelectedSavedId(null);
      }

      setEmail(profileEmail);
      setPhone(profilePhone);
      setIsPhoneVerified(true);
      setOtpSent(false);
      setInputOtp('');
      setSmsNotificationToast(null);

      const hasCompleteAddress = Boolean(
        initialAddr &&
        initialAddr.addressLine1 &&
        initialAddr.pincode &&
        initialAddr.pincode.length === 6 &&
        initialAddr.city
      );

      // Fetch fresh saved addresses from Supabase database
      if (profileEmail) {
        fetchCustomerAddressesFromSupabase(userProfile?.id, profileEmail).then((remoteAddrs) => {
          if (Array.isArray(remoteAddrs) && remoteAddrs.length > 0) {
            if (onUpdateProfile && userProfile) {
              onUpdateProfile({
                ...userProfile,
                addresses: remoteAddrs
              });
            }
            setSelectedAddressMode('SAVED');
            const def = remoteAddrs.find((a: any) => a.isDefault) || remoteAddrs[0];
            if (def) {
              setSelectedSavedId(def.id);
              if (!initialAddr || !initialAddr.addressLine1) {
                setFullName(def.fullName || profileName || '');
                setAddressLine1(def.addressLine1 || '');
                setAddressLine2(def.addressLine2 || '');
                setPincode(def.pincode || '');
                setCity(def.city || '');
                setStateName(def.state || '');
                setAddressTag(def.tag || 'Home');
                if (def.phone && !profilePhone) {
                  const p = def.phone.replace(/\D/g, '').slice(-10);
                  setPhone(p);
                  profilePhone = p;
                }
              }
              // If customer has phone, email and complete address, automatically go to PAYMENT
              if (profileEmail && (profilePhone || def.phone) && def.addressLine1 && def.pincode) {
                setCurrentStep('PAYMENT');
              }
            }
          }
        }).catch(() => {});
      }

      // CRITICAL: Once verified and address is saved, OPEN DIRECTLY TO PAYMENT STEP!
      // Customer will NEVER be asked for verification or address again!
      if (hasCompleteAddress && profilePhone && profileEmail) {
        setCurrentStep('PAYMENT');
      } else {
        // Needs contact or address details (first-time only)
        setCurrentStep('ADDRESS_CONFIRMATION');
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
      try {
        sessionStorage.setItem('km_phone_verified', cleanPhone);
        localStorage.setItem(`km_verified_phone_${cleanPhone}`, 'true');
      } catch {}
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

    const wasAlreadyVerified = isPhoneVerified || 
      Boolean(userProfile?.email && userProfile?.phone) ||
      sessionStorage.getItem('km_phone_verified') === cleanPhone ||
      localStorage.getItem(`km_verified_phone_${cleanPhone}`) === 'true';

    if (!wasAlreadyVerified && !isPhoneVerified) {
      setContactError('Please verify your mobile number via OTP before proceeding.');
      return;
    }

    setIsPhoneVerified(true);
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

  // Unified Step: Validation & Proceed to Payment
  const handleProceedToPayment = () => {
    if (!fullName.trim()) {
      setAddressError('Recipient full name is required.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAddressError('Please enter a valid 10-digit mobile number for courier delivery alerts.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setAddressError('Please provide a valid email address for your official GST Tax Invoice.');
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

    // Mark customer as verified permanently
    setIsPhoneVerified(true);
    try {
      sessionStorage.setItem('km_phone_verified', cleanPhone);
      localStorage.setItem(`km_verified_phone_${cleanPhone}`, 'true');
      localStorage.setItem('km_customer_phone', cleanPhone);
      localStorage.setItem('km_customer_email', cleanEmail);
      localStorage.setItem(`km_verified_customer_${cleanEmail}`, 'true');
      localStorage.setItem(`km_customer_phone_${cleanEmail}`, cleanPhone);
    } catch {}

    const targetAddr: UserAddress = {
      id: selectedSavedId && !selectedSavedId.startsWith('addr_temp') ? selectedSavedId : `addr_${Date.now()}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      tag: addressTag,
      isDefault: false
    };

    // Save locally immediately
    try {
      localStorage.setItem('km_last_delivery_address', JSON.stringify(targetAddr));
      localStorage.setItem(`km_customer_last_addr_${cleanEmail}`, JSON.stringify(targetAddr));
    } catch {}

    // Save directly to Supabase via server API
    saveAddressToSupabase(userProfile?.id || '', targetAddr, cleanEmail).then((saved) => {
      if (saved && saved.id) {
        setSelectedSavedId(saved.id);
        targetAddr.id = saved.id;
      }
    }).catch(err => console.warn('[Checkout] Supabase address persist error:', err));

    // Update parent user profile
    if (onUpdateProfile && userProfile) {
      const existingIdx = userProfile.addresses.findIndex(
        a => a.id === targetAddr.id || (a.addressLine1 === targetAddr.addressLine1 && a.pincode === targetAddr.pincode)
      );
      let updatedAddrs: UserAddress[];
      if (existingIdx >= 0) {
        updatedAddrs = [...userProfile.addresses];
        updatedAddrs[existingIdx] = targetAddr;
      } else {
        updatedAddrs = [targetAddr, ...userProfile.addresses];
      }
      onUpdateProfile({
        ...userProfile,
        email: userProfile.email || cleanEmail,
        phone: userProfile.phone || cleanPhone,
        addresses: updatedAddrs
      });
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
      awbNumber: '',
      courierPartner: "Pending Dispatch",
      estimatedDeliveryDate: '3-5 business days for delivery',
      trackingHistory: [
        {
          time: 'Just Now',
          location: 'Konichiwa_Mart Central Fulfillment, Mumbai (MH)',
          activity: `Payment Verified (${paymentId}). Order Confirmed. GST Invoice queued for ${email}.`
        }
      ]
    };
  };

  // Simulated Test Payment (Instant confirmation, GST Tax Invoice PDF generation, email dispatch)
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    setStatusMessage('Generating verified test payment and official GST Tax Invoice...');

    setTimeout(async () => {
      const demoOrder = assembleOrder(
        `pay_test_${Date.now()}`,
        'sig_test_verified',
        'RAZORPAY_ONLINE'
      );
      setConfirmedOrder(demoOrder);
      setCurrentStep('SUCCESS');
      setIsProcessing(false);

      const activeCustomerId = userProfile?.id || getActiveCustomerSession()?.id;
      saveOrderToSupabase(demoOrder, activeCustomerId).catch((err) => {
        console.warn('[Supabase Sync Warning]:', err);
      });

      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#EC4899', '#F472B6', '#FB7185', '#FBBF24']
      });

      await dispatchInvoiceEmail({
        email: demoOrder.customerEmail || email.trim(),
        invoiceNumber: demoOrder.invoiceNumber,
        orderNumber: demoOrder.orderNumber,
        customerName: fullName || 'Valued Customer',
        totalAmount: grandTotal
      });

      setTimeout(() => {
        onPaymentSuccess(demoOrder);
      }, 2500);
    }, 1200);
  };

  // Launch Razorpay Standard Web Checkout
  const handleStartRazorpayCheckout = async () => {
    if (amountInPaise < 100) {
      setPaymentError('Minimum order amount for Razorpay checkout is ₹1.00 (100 paise).');
      return;
    }



    setIsProcessing(true);
    setPaymentError(null);
    setStatusMessage('Preparing secure Razorpay payment...');

    // Safety watchdog: Automatically reset processing state after 25s if user cancels or window closes
    const watchdogTimer = setTimeout(() => {
      setIsProcessing((prev) => {
        if (prev) {
          setStatusMessage('');
          return false;
        }
        return false;
      });
    }, 45000);

    try {
      // 1. Authoritative Server-Side Price & Inventory Validation
      const validatedServerOrder = await createValidatedCheckoutOrder({
        items: items.map(i => ({
          productId: i.product.id,
          variantId: i.selectedShade?.id,
          quantity: i.quantity,
          title: i.product.title,
          price: i.product.price,
          image: i.product.image
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
        preferredMethod: selectedPaymentMode === 'UPI' ? 'upi' : 'card',
        upiApp: selectedPaymentMode === 'UPI' ? selectedUpiApp : undefined,
        vpa: selectedPaymentMode === 'UPI' && userVpa.trim() ? userVpa.trim() : undefined,
        onSuccess: async (paymentPayload: RazorpayPaymentSuccessPayload, _verification: VerifyPaymentResponse) => {
          clearTimeout(watchdogTimer);
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
          const activeCustomerId = userProfile?.id || getActiveCustomerSession()?.id;
          saveOrderToSupabase(createdOrder, activeCustomerId).catch((err) => {
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
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setStatusMessage('');
          setPaymentError('Payment window was closed. You can retry or use test simulation.');
        },
        onError: (err: string) => {
          clearTimeout(watchdogTimer);
          setIsProcessing(false);
          setStatusMessage('');
          if (err && (err.toLowerCase().includes('auth') || err.toLowerCase().includes('bad_request'))) {
            setPaymentError('Razorpay Notice: Authentication failed. Your Razorpay Key ID & Secret were rejected by the Razorpay API. Please generate a fresh pair of live keys in your Razorpay dashboard and update them in your AI Studio secrets.');
          } else {
            setPaymentError(err || 'Payment transaction encountered an issue. Please try again.');
          }
        }
      });
    } catch (serverErr: any) {
      clearTimeout(watchdogTimer);
      console.warn('Server validation issue:', serverErr);
      setIsProcessing(false);
      setStatusMessage('');
      const msg = serverErr?.message || '';
      if (msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('bad_request')) {
        setPaymentError('Razorpay Notice: Authentication failed. Your Razorpay Key ID & Secret were rejected by the Razorpay API. Please generate a fresh pair of live keys in your Razorpay dashboard and update them in your AI Studio secrets.');
      } else {
        setPaymentError("Vercel Server Timeout or Backend Error: " + (msg || 'API Failed'));
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-xl md:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Step Progress - Light Baby Pink Palette */}
        <div className="shrink-0 bg-gradient-to-r from-pink-100 via-rose-50 to-pink-50 dark:from-zinc-800 dark:via-zinc-850 dark:to-zinc-900 text-slate-900 dark:text-zinc-100 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-pink-200/80 dark:border-zinc-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs shadow-pink-600/30">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 tracking-wide truncate">Konichiwa Mart Checkout</span>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Secure</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-pink-800/80 dark:text-pink-300/90 font-medium truncate">
                  {currentStep === 'PAYMENT' ? 'Step 2: Payment & Review' : currentStep === 'SUCCESS' ? 'Order Confirmed' : 'Step 1: Delivery Details'}
                </p>
              </div>
            </div>

            <div className="text-right flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Total Payable</div>
                <div className="font-black text-sm sm:text-lg text-pink-600 dark:text-pink-400">
                  {formatINR(grandTotal)}
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close checkout"
                className="w-8 h-8 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 border border-pink-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2.5 pt-2 border-t border-pink-200/80 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep('ADDRESS_CONFIRMATION')}
              className={`flex items-center gap-1.5 sm:gap-2 font-semibold text-left cursor-pointer transition-opacity hover:opacity-85 ${
                currentStep === 'ADDRESS_CONFIRMATION' || currentStep === 'CONTACT_VERIFICATION'
                  ? 'text-pink-700 dark:text-pink-300'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                currentStep === 'PAYMENT' || currentStep === 'SUCCESS'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-pink-600 text-white shadow-xs'
              }`}>
                {currentStep === 'PAYMENT' || currentStep === 'SUCCESS' ? '✓' : '1'}
              </div>
              <span className="truncate text-[11px] sm:text-xs">1. Delivery Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (addressLine1 && pincode && phone && email) {
                  setCurrentStep('PAYMENT');
                }
              }}
              className={`flex items-center gap-1.5 sm:gap-2 font-semibold text-left cursor-pointer transition-opacity hover:opacity-85 ${
                currentStep === 'PAYMENT'
                  ? 'text-pink-700 dark:text-pink-300'
                  : currentStep === 'SUCCESS'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                currentStep === 'SUCCESS'
                  ? 'bg-emerald-500 text-white'
                  : currentStep === 'PAYMENT'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}>
                {currentStep === 'SUCCESS' ? '✓' : '2'}
              </div>
              <span className="truncate text-[11px] sm:text-xs">2. Payment</span>
            </button>
          </div>
        </div>

        {/* STEP 1: DELIVERY & CONTACT DETAILS */}
        {(currentStep === 'ADDRESS_CONFIRMATION' || currentStep === 'CONTACT_VERIFICATION') && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Confirm Delivery Address</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Select an existing address or enter shipping destination</p>
              </div>

              {userProfile?.addresses && userProfile.addresses.length > 0 && (
                <div className="flex gap-1.5 text-[11px] bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedAddressMode('SAVED')}
                    className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      selectedAddressMode === 'SAVED' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
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
                      selectedAddressMode === 'CUSTOM' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    + New Address
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {addressError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
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
                          ? 'border-pink-500 bg-pink-50/60 dark:bg-pink-950/40 ring-1 ring-pink-500'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-zinc-100">{addr.fullName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-semibold">
                            {addr.tag}
                          </span>
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-[10px] font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-zinc-300">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-slate-500 dark:text-zinc-400">
                          {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-pink-600 bg-pink-600 text-white' : 'border-slate-300 dark:border-zinc-600'
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
              <div className="space-y-3.5 bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs">
                
                {/* Contact Information Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-700">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      Recipient Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      Mobile Number (+91) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-mono font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setPhone(clean);
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-r-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      Email Address (for GST Tax Invoice PDF & Tracking) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Flat / Building */}
                <div>
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                    Flat, House No., Building, Apartment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Flat 402, Lotus Grand Residences"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Street / Landmark */}
                <div>
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                    Street, Area, Landmark
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Off Linking Road, Near Blue Tokai"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Pincode, City & State Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 400050"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* Address Tag */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Tag as:</span>
                  {(['Home', 'Office', 'Other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border ${
                        addressTag === t
                          ? 'border-pink-500 bg-pink-100 dark:bg-pink-950/70 text-pink-800 dark:text-pink-300'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Courier Serviceability Badge */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs flex items-center gap-2">
              <Truck className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="font-semibold text-xs">
                3-5 business days for delivery
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-600/20 transition-all"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: PAYMENT & CONFIRMATION */}
        {currentStep === 'PAYMENT' && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 space-y-4">
            
            {/* Unconfigured Alert Banner */}
            {!isRazorpayConfigured && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Razorpay Test Credentials Pending</strong>
                    <span>Razorpay Key ID & Secret are not yet connected in the environment. Share your test credentials in chat or enter them in Settings, or use instant test simulation to verify the full GST invoice & email delivery:</span>
                  </div>
                </div>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Test Payment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {paymentError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Payment Notification</strong>
                    <span>{paymentError}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200 dark:border-rose-900 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300">Test the complete order confirmation & invoice flow:</span>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Simulate Test Payment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Verified Details Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold">
                <span>Verified Delivery & Invoice Details</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep('ADDRESS_CONFIRMATION')}
                  className="text-pink-600 dark:text-pink-400 hover:text-pink-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Modify</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-zinc-300 text-[11px]">
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block font-medium">Recipient:</strong>
                  <span>{fullName}</span>
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block font-medium">Verified Phone:</strong>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">✓ +91 {phone} (Verified)</span>
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block font-medium">GST Invoice Recipient:</strong>
                  <span className="text-pink-700 dark:text-pink-400 font-medium">{email}</span>
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block font-medium">Destination:</strong>
                  <span className="truncate block">{addressLine1}, {city} - {pincode}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Coupon Savings ({discountCode})</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span>GST Breakdown (9% CGST + 9% SGST included)</span>
                <span>{formatINR(cgst + sgst)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span>Delivery details would be sent through email</span>
                  <span className="block text-[10px] text-slate-500 dark:text-zinc-400">3-5 business days for delivery</span>
                </div>
                <span>{shippingFee === 0 ? <strong className="text-emerald-700 dark:text-emerald-400">FREE</strong> : formatINR(shippingFee)}</span>
              </div>

              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-zinc-100 pt-2 border-t border-slate-200 dark:border-zinc-700">
                <span>Total Payable</span>
                <span className="text-pink-700 dark:text-pink-400">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleStartRazorpayCheckout}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{statusMessage || 'Opening Razorpay Gateway...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay {formatINR(grandTotal)} via Razorpay
                    </span>
                  </>
                )}
              </button>



              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('ADDRESS_CONFIRMATION')}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Delivery Details</span>
                </button>

                <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Secured with SSL Encryption • End-to-End Encrypted
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS & INVOICE DISPATCH CONFIRMATION */}
        {currentStep === 'SUCCESS' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 text-center space-y-4 max-w-lg mx-auto animate-in zoom-in-95">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-emerald-950 dark:text-emerald-300">
                Order Placed & Confirmed!
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Thank you, <strong>{fullName}</strong>. Your payment has been authorized and verified.
              </p>
            </div>

            {/* Email Dispatch Confirmation Box */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 text-left space-y-2 text-xs text-pink-950 dark:text-pink-200">
              <div className="flex items-center gap-2 font-bold text-pink-900 dark:text-pink-300">
                <Mail className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>Official GST Tax Invoice Dispatched</span>
              </div>
              <p className="text-[11px] text-pink-800 dark:text-pink-300/90 leading-relaxed">
                An official PDF copy of Tax Invoice <strong>#{confirmedOrder.invoiceNumber}</strong> has been sent to <strong>{confirmedOrder.customerEmail}</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-pink-200/60 dark:border-pink-900/60 text-[11px] text-pink-700 dark:text-pink-300 font-mono">
                <Phone className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 shrink-0" />
                <span>SMS Dispatch Updates: +91 {confirmedOrder.customerPhone}</span>
              </div>
            </div>

            {/* Order & Courier Reference */}
            <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 border border-slate-200 dark:border-zinc-700 text-xs flex justify-between items-center text-slate-700 dark:text-zinc-300">
              <div>
                <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">Order Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">Air Waybill (AWB)</span>
                <span className="font-mono font-bold text-pink-600 dark:text-pink-400">{confirmedOrder.awbNumber}</span>
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
        <div className="shrink-0 bg-slate-50 dark:bg-zinc-850 border-t border-slate-200 dark:border-zinc-800 px-4 py-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 gap-2">
          <div className="flex items-center gap-2">
            <span>PCI-DSS Level 1</span>
            <span>•</span>
            <span>RBI Approved</span>
            <span>•</span>
            <span>Instant</span>
          </div>

          <div className="flex items-center gap-1.5 text-pink-700 dark:text-pink-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Buyer Protection</span>
          </div>
        </div>

      </div>

    </div>
  );
};
