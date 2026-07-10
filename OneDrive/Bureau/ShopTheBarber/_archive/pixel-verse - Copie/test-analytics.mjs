// Test script for analytics APIs
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

// Test data - you can use any of these test accounts
const testAccounts = {
  admin: { email: 'admin@test.com', password: 'password123' },
  barber: { email: 'barber1@test.com', password: 'password123' },
  client: { email: 'client1@test.com', password: 'password123' }
};

async function testAnalytics() {
  console.log('🧪 Testing Analytics APIs...\n');

  // Test with admin account
  console.log('📊 Testing Admin Analytics:');
  try {
    const adminToken = await login(testAccounts.admin);
    const adminOverview = await getAnalytics('/analytics/overview', adminToken);
    console.log('✅ Admin Overview:', {
      totalUsers: adminOverview.totalUsers,
      totalBarbers: adminOverview.totalBarbers,
      totalAppointments: adminOverview.totalAppointments,
      totalRevenue: adminOverview.totalRevenue
    });

    const adminRevenue = await getAnalytics('/analytics/revenue?period=monthly', adminToken);
    console.log('✅ Admin Revenue Data:', adminRevenue.length, 'records');

    const adminPerformance = await getAnalytics('/analytics/performance', adminToken);
    console.log('✅ Admin Performance Data:', {
      topBarbers: adminPerformance.topBarbers?.length || 0,
      servicePerformance: adminPerformance.servicePerformance?.length || 0
    });
  } catch (error) {
    console.log('❌ Admin Analytics Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with barber account
  console.log('✂️ Testing Barber Analytics:');
  try {
    const barberToken = await login(testAccounts.barber);
    const barberOverview = await getAnalytics('/analytics/overview', barberToken);
    console.log('✅ Barber Overview:', {
      totalAppointments: barberOverview.totalAppointments,
      completedAppointments: barberOverview.completedAppointments,
      totalRevenue: barberOverview.totalRevenue,
      avgRating: barberOverview.avgRating
    });

    const barberRevenue = await getAnalytics('/analytics/revenue?period=monthly', barberToken);
    console.log('✅ Barber Revenue Data:', barberRevenue.length, 'records');

    const barberPerformance = await getAnalytics('/analytics/performance', barberToken);
    console.log('✅ Barber Performance Data:', {
      monthlyPerformance: barberPerformance.monthlyPerformance?.length || 0,
      serviceBreakdown: barberPerformance.serviceBreakdown?.length || 0
    });
  } catch (error) {
    console.log('❌ Barber Analytics Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with client account
  console.log('👤 Testing Client Analytics:');
  try {
    const clientToken = await login(testAccounts.client);
    const clientOverview = await getAnalytics('/analytics/overview', clientToken);
    console.log('✅ Client Overview:', {
      totalBookings: clientOverview.totalBookings,
      completedBookings: clientOverview.completedBookings,
      totalSpent: clientOverview.totalSpent,
      favoriteBarbers: clientOverview.favoriteBarbers
    });

    const clientRevenue = await getAnalytics('/analytics/revenue?period=monthly', clientToken);
    console.log('✅ Client Revenue Data:', clientRevenue.length, 'records');
  } catch (error) {
    console.log('❌ Client Analytics Error:', error.message);
  }

  console.log('\n🎉 Analytics API Testing Complete!');
}

async function login(credentials) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function getAnalytics(endpoint, token) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return await response.json();
}

// Run the test
testAnalytics().catch(console.error); 