// Simple test script to verify DCR user profile functionality
const axios = require('axios');

async function testUserProfile() {
  try {
    // First, login to get a JWT token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/signin', {
      email: 'rashini@gshealth.lk',
      password: 'rashi@123'
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful, token received');
      
      // Now test the user profile endpoint
      console.log('\nFetching user profile...');
      const profileResponse = await axios.get('http://localhost:5000/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile response:', JSON.stringify(profileResponse.data, null, 2));
      
      // Check if the profile has the expected structure for DCR
      const user = profileResponse.data.user;
      console.log('\n--- DCR Profile Analysis ---');
      console.log('Name:', user.name);
      console.log('Emp No:', user.emp_no);
      console.log('Agency:', user.agency?.name);
      console.log('Range:', user.range?.name);
      console.log('Primary Distributor:', user.distributor?.name);
      console.log('Distributor Area:', user.distributor?.area?.name);
      console.log('Distributor Town:', user.distributor?.coverage_town);
      console.log('All Distributors:', user.distributors?.length || 0);
      
      if (user.distributors && user.distributors.length > 0) {
        console.log('\n✅ Multiple distributors detected - DCR form should work correctly');
        console.log('Primary distributor for DCR:', user.distributors[0].name);
      } else if (user.distributor) {
        console.log('\n✅ Single distributor (backward compatibility) - DCR form should work correctly');
      } else {
        console.log('\n❌ No distributors found');
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testUserProfile();