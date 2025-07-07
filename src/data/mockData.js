import moment from 'moment';

// Mock store data
export const mockStores = [
  { code: 'E014', name: 'Enderpark Adana', address: 'Kurtuluş, Atatürk Cad. No:41/A, 01120 Seyhan/Adana', status: 'active' },
  { code: 'Y013', name: 'Adana YeniKoza', address: 'Tepebağ, Çakmak Cd. No:92, 01010 Seyhan/Adana', status: 'active' },
  { code: 'Y261', name: 'Ender Eskişehir', address: 'İstiklal, İki Eylül Cd. No:18, 26010 Odunpazarı/Eskişehir', status: 'warning' },
  { code: 'Y332', name: 'YeniKoza Mersin', address: 'Cami Şerif, Kuvayi Milliye Cd. 28 A, 33060 Akdeniz/Mersin', status: 'active' },
  { code: 'Y342', name: 'Ender Bakırköy', address: 'Cevizlik, İstanbul Cd. No:61 D:61, 34142 Bakırköy/İstanbul', status: 'error' },
  { code: 'Y421', name: 'YeniKoza Konya', address: 'Sahibiata, Mimar Muzaffer Cd. No:45, 42040 Meram/Konya', status: 'active' }
];

// Mock dashboard overview data
export const mockOverview = {
  activeTablets: 12,
  todayCustomers: 47,
  successRate: 0,
  errorCount: 3,
  totalSMS: 156,
  smsSuccessRate: 98.1,
  avgProcessingTime: 2.3, // minutes
  lastUpdate: moment().format('HH:mm:ss')
};

// Mock store status data
export const mockStoreStatus = [
  {
    storeCode: 'E014',
    storeName: 'Enderpark Adana',
    isActive: true,
    todayCustomers: 12,
    errorCount: 0,
    lastActivity: moment().subtract(2, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'active'
  },
  {
    storeCode: 'Y013',
    storeName: 'Adana YeniKoza',
    isActive: true,
    todayCustomers: 8,
    errorCount: 1,
    lastActivity: moment().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'active'
  },
  {
    storeCode: 'Y261',
    storeName: 'Ender Eskişehir',
    isActive: true,
    todayCustomers: 3,
    errorCount: 2,
    lastActivity: moment().subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'warning'
  },
  {
    storeCode: 'Y332',
    storeName: 'YeniKoza Mersin',
    isActive: true,
    todayCustomers: 15,
    errorCount: 0,
    lastActivity: moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'active'
  },
  {
    storeCode: 'Y342',
    storeName: 'Ender Bakırköy',
    isActive: false,
    todayCustomers: 0,
    errorCount: 5,
    lastActivity: moment().subtract(45, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'error'
  },
  {
    storeCode: 'Y421',
    storeName: 'YeniKoza Konya',
    isActive: true,
    todayCustomers: 9,
    errorCount: 0,
    lastActivity: moment().subtract(3, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    status: 'active'
  }
];

// Mock SMS analytics data
export const mockSMSAnalytics = {
  totalSent: 156,
  totalSuccess: 153,
  totalFailed: 3,
  successRate: 98.1,
  avgResponseTime: 2.3,
  timeoutRate: 3.2,
  approvalTypes: [
    { type: 'Sözleşme Onayı', total: 150, success: 142, rate: 94.7, status: 'active' },
    { type: 'KVK Onayı', total: 0, success: 0, rate: 0, status: 'inactive' },
    { type: 'Reklam Onayı', total: 0, success: 0, rate: 0, status: 'inactive' }
  ],
  hourlyData: [
    { hour: '08:00', sent: 5, success: 5 },
    { hour: '09:00', sent: 12, success: 12 },
    { hour: '10:00', sent: 18, success: 17 },
    { hour: '11:00', sent: 22, success: 21 },
    { hour: '12:00', sent: 15, success: 15 },
    { hour: '13:00', sent: 8, success: 8 },
    { hour: '14:00', sent: 25, success: 24 },
    { hour: '15:00', sent: 30, success: 30 },
    { hour: '16:00', sent: 21, success: 21 }
  ]
};

// Mock error logs
export const mockErrorLogs = [
  {
    id: 1,
    timestamp: moment().subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'ERROR',
    category: 'CUSTOMER_CREATE',
    message: 'API connection timeout',
    storeCode: 'Y342',
    storeName: 'Ender Bakırköy',
    data: {
      errorCode: 500,
      timeout: true,
      apiEndpoint: '/api/createCustomer'
    }
  },
  {
    id: 2,
    timestamp: moment().subtract(25, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'WARNING',
    category: 'SMS_APPROVAL',
    message: 'SMS response time exceeded 5 seconds',
    storeCode: 'Y261',
    storeName: 'EnderEskişehir',
    data: {
      responseTime: 6.8,
      phoneNumber: '905*****23'
    }
  },
  {
    id: 3,
    timestamp: moment().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    level: 'ERROR',
    category: 'VALIDATION',
    message: 'Phone number validation failed',
    storeCode: 'Y013',
    storeName: 'Adana YeniKoza',
    data: {
      phoneNumber: '905*****45',
      validationError: 'Phone already registered with different TC'
    }
  },
  {
    id: 4,
    timestamp: moment().subtract(2, 'hours').format('YYYY-MM-DD HH:mm:ss'),
    level: 'INFO',
    category: 'CUSTOMER_CREATE',
    message: 'Customer created successfully',
    storeCode: 'E014',
    storeName: 'Enderpark Adana',
    data: {
      customerId: 'C123456',
      processingTime: 1.8
    }
  },
  {
    id: 5,
    timestamp: moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss'),
    level: 'ERROR',
    category: 'CUSTOMER_CREATE',
    message: 'Database connection failed',
    storeCode: 'Y342',
    storeName: 'Ender Bakırköy',
    data: {
      dbError: 'Connection timeout after 30 seconds',
      retryCount: 3
    }
  },
  // Yeni müşteri kontrolü logları
  {
    id: 6,
    timestamp: moment().subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'ERROR',
    category: 'CUSTOMER_VALIDATION',
    message: 'TC kimlik numarası doğrulama başarısız',
    storeCode: 'Y332',
    storeName: 'YeniKoza Mersin',
    data: {
      tcNumber: '123*****890',
      validationError: 'TC kimlik numarası geçersiz',
      attemptCount: 2
    }
  },
  {
    id: 7,
    timestamp: moment().subtract(20, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'WARNING',
    category: 'CUSTOMER_VALIDATION',
    message: 'Müşteri bilgileri eksik',
    storeCode: 'Y013',
    storeName: 'Adana YeniKoza',
    data: {
      missingFields: ['dateOfBirth', 'address'],
      customerInfo: 'Partial data received'
    }
  },
  {
    id: 8,
    timestamp: moment().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'ERROR',
    category: 'CUSTOMER_VALIDATION',
    message: 'Kişi zaten sistemde mevcut',
    storeCode: 'E014',
    storeName: 'Enderpark Adana',
    data: {
      existingCustomerId: 'C654321',
      duplicateFields: ['tcNumber', 'phoneNumber'],
      action: 'rejected'
    }
  },
  {
    id: 9,
    timestamp: moment().subtract(45, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    level: 'INFO',
    category: 'CUSTOMER_VALIDATION',
    message: 'Müşteri kontrolü başarılı',
    storeCode: 'Y421',
    storeName: 'YeniKoza Konya',
    data: {
      validationTime: 1.2,
      checksCompleted: ['tcValidation', 'phoneValidation', 'duplicateCheck'],
      result: 'approved'
    }
  },
  {
    id: 10,
    timestamp: moment().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    level: 'WARNING',
    category: 'CUSTOMER_VALIDATION',
    message: 'Müşteri yaş kontrolü uyarısı',
    storeCode: 'Y261',
    storeName: 'Ender Eskişehir',
    data: {
      customerAge: 17,
      minRequiredAge: 18,
      action: 'requires_guardian_approval'
    }
  }
];

// Mock alerts
export const mockAlerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Y342 Mağazası Offline',
    message: 'Ender Bakırköy mağazası 45 dakikadır yanıt vermiyor',
    timestamp: moment().subtract(45, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    isRead: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'SMS Servisi Yavaş',
    message: 'SMS yanıt süresi ortalama 5 saniyeyi aştı',
    timestamp: moment().subtract(20, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    isRead: false
  },
  {
    id: 3,
    type: 'error',
    title: 'E014 Müşteri Oluşturma Hatası',
    message: 'Son 1 saatte %30 başarısızlık oranı',
    timestamp: moment().subtract(35, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    isRead: true
  }
];

// Mock daily trend data
export const mockDailyTrend = [
  { date: moment().subtract(6, 'days').format('MM-DD'), customers: 42, success: 38, errors: 4 },
  { date: moment().subtract(5, 'days').format('MM-DD'), customers: 38, success: 36, errors: 2 },
  { date: moment().subtract(4, 'days').format('MM-DD'), customers: 45, success: 43, errors: 2 },
  { date: moment().subtract(3, 'days').format('MM-DD'), customers: 52, success: 48, errors: 4 },
  { date: moment().subtract(2, 'days').format('MM-DD'), customers: 48, success: 46, errors: 2 },
  { date: moment().subtract(1, 'days').format('MM-DD'), customers: 41, success: 39, errors: 2 },
  { date: moment().format('MM-DD'), customers: 47, success: 44, errors: 3 }
];

// Performance metrics
export const mockPerformanceMetrics = {
  apiResponseTime: 234, // ms
  errorRate: 2.1, // %
  uptime: 99.8, // %
  memoryUsage: 68, // %
  diskUsage: 45, // %
  cpuUsage: 23 // %
}; 