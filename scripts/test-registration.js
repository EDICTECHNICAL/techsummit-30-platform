// Test registration API
async function testRegistration() {
  const testUser = {
    username: 'testleader99',
    password: 'password123',
    name: 'Test Leader 99',
    teamName: 'Test Team 99',
    college: 'Test University'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User:', result.user);
      console.log('Team:', result.team);
      console.log('User assigned to team ID:', result.user.teamId);
    } else {
      console.log('❌ Registration failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

testRegistration();