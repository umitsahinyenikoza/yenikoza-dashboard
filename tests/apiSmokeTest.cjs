const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3002/api';
const TEST_USER = { username: 'admin', password: 'umit5508' };

let authToken = null;

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  const data = await res.json();
  if (data.success && data.token) {
    authToken = data.token;
    console.log('✅ Login başarılı');
  } else {
    throw new Error('❌ Login başarısız');
  }
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

async function testReports() {
  // Rapor türleri
  const typesRes = await fetch(`${API_BASE}/reports/types`, { headers: getHeaders() });
  const types = await typesRes.json();
  if (types.success && Array.isArray(types.data)) {
    console.log('✅ Rapor türleri alındı:', types.data.map(t => t.id).join(', '));
  } else {
    throw new Error('❌ Rapor türleri alınamadı');
  }

  // Rapor oluştur
  const genRes = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reportType: 'overview', period: 'daily' })
  });
  const gen = await genRes.json();
  if (gen.success && gen.data && gen.data.reportType === 'overview') {
    console.log('✅ Rapor oluşturma başarılı');
  } else {
    throw new Error('❌ Rapor oluşturulamadı');
  }

  // Son raporlar
  const recentRes = await fetch(`${API_BASE}/reports/recent`, { headers: getHeaders() });
  const recent = await recentRes.json();
  if (recent.success && Array.isArray(recent.data)) {
    console.log('✅ Son raporlar alındı');
  } else {
    throw new Error('❌ Son raporlar alınamadı');
  }

  // Raporu ID ile al
  const reportRes = await fetch(`${API_BASE}/reports/1`, { headers: getHeaders() });
  const report = await reportRes.json();
  if (report.success && report.data && report.data.id === 1) {
    console.log('✅ Rapor ID ile alındı');
  } else {
    throw new Error('❌ Rapor ID ile alınamadı');
  }

  // Rapor indirme
  const downloadRes = await fetch(`${API_BASE}/reports/1/download?format=pdf`, { headers: getHeaders() });
  if (downloadRes.ok && downloadRes.headers.get('content-type') === 'application/pdf') {
    console.log('✅ Rapor indirme başarılı');
  } else {
    throw new Error('❌ Rapor indirme başarısız');
  }
}

async function testSettings() {
  // Profil
  const profileRes = await fetch(`${API_BASE}/settings/profile`, { headers: getHeaders() });
  const profile = await profileRes.json();
  if (profile.success && profile.data && profile.data.name) {
    console.log('✅ Profil bilgisi alındı:', profile.data.name);
  } else {
    throw new Error('❌ Profil bilgisi alınamadı');
  }

  // Bildirim ayarları
  const notifRes = await fetch(`${API_BASE}/settings/notifications`, { headers: getHeaders() });
  const notif = await notifRes.json();
  if (notif.success && notif.data) {
    console.log('✅ Bildirim ayarları alındı');
  } else {
    throw new Error('❌ Bildirim ayarları alınamadı');
  }

  // Dashboard ayarları
  const dashRes = await fetch(`${API_BASE}/settings/dashboard`, { headers: getHeaders() });
  const dash = await dashRes.json();
  if (dash.success && dash.data) {
    console.log('✅ Dashboard ayarları alındı');
  } else {
    throw new Error('❌ Dashboard ayarları alınamadı');
  }

  // API anahtarları
  const keysRes = await fetch(`${API_BASE}/settings/api-keys`, { headers: getHeaders() });
  const keys = await keysRes.json();
  if (keys.success && Array.isArray(keys.data)) {
    console.log('✅ API anahtarları alındı');
  } else {
    throw new Error('❌ API anahtarları alınamadı');
  }
}

(async () => {
  try {
    await login();
    await testReports();
    await testSettings();
    console.log('\n🎉 TÜM TESTLER BAŞARILI!');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})(); 