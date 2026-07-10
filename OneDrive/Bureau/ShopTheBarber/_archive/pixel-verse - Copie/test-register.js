const testRegistration = async () => {
  const uniqueEmail = `test${Date.now()}@example.com`;
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        password: 'password123',
        role: 'client'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('Token:', data.token);
      console.log('UserId:', data.userId);
      console.log('Role:', data.role);
    } else {
      console.log('❌ Registration failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testRegistration(); 