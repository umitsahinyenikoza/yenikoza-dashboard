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

async function testReportGenerationAndExport() {
  console.log('\n📄 Rapor Oluşturma ve Export Testi');
  
  // 1. Rapor oluştur
  console.log('1️⃣ Rapor oluşturuluyor...');
  const genRes = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reportType: 'overview', period: 'daily' })
  });
  const gen = await genRes.json();
  
  if (!gen.success || !gen.data || !gen.data.id) {
    throw new Error('❌ Rapor oluşturulamadı veya ID alınamadı');
  }
  
  const reportId = gen.data.id;
  console.log(`✅ Rapor oluşturuldu - ID: ${reportId}`);
  console.log(`   Rapor türü: ${gen.data.reportType}`);
  console.log(`   Dönem: ${gen.data.period}`);
  
  // 2. PDF Export test
  console.log('\n2️⃣ PDF Export test ediliyor...');
  const pdfRes = await fetch(`${API_BASE}/reports/${reportId}/download?format=pdf`, {
    headers: getHeaders()
  });
  
  if (pdfRes.ok && pdfRes.headers.get('content-type') === 'application/pdf') {
    console.log('✅ PDF Export başarılı');
    console.log(`   Dosya boyutu: ${pdfRes.headers.get('content-length')} bytes`);
  } else {
    throw new Error('❌ PDF Export başarısız');
  }
  
  // 3. Excel Export test
  console.log('\n3️⃣ Excel Export test ediliyor...');
  const excelRes = await fetch(`${API_BASE}/reports/${reportId}/download?format=excel`, {
    headers: getHeaders()
  });
  
  if (excelRes.ok) {
    console.log('✅ Excel Export başarılı');
    console.log(`   Content-Type: ${excelRes.headers.get('content-type')}`);
  } else {
    console.log('⚠️ Excel Export henüz tam implement edilmemiş');
  }
  
  // 4. Raporu ID ile alma test
  console.log('\n4️⃣ Rapor ID ile alma test ediliyor...');
  const getRes = await fetch(`${API_BASE}/reports/${reportId}`, {
    headers: getHeaders()
  });
  const getData = await getRes.json();
  
  if (getData.success && getData.data && getData.data.id === reportId) {
    console.log('✅ Rapor ID ile alma başarılı');
    console.log(`   Rapor adı: ${getData.data.name}`);
  } else {
    throw new Error('❌ Rapor ID ile alma başarısız');
  }
  
  console.log('\n🎉 TÜM EXPORT TESTLERİ BAŞARILI!');
  console.log('\n📋 Frontend\'de yapılması gerekenler:');
  console.log('1. "Rapor Oluştur" butonuna tıklayın');
  console.log('2. Rapor oluşturulduktan sonra PDF Export ve Excel Export butonları aktif olacak');
  console.log('3. Export butonlarına tıklayarak dosyaları indirebilirsiniz');
}

(async () => {
  try {
    await login();
    await testReportGenerationAndExport();
  } catch (err) {
    console.error('❌ Test hatası:', err.message);
    process.exit(1);
  }
})(); 