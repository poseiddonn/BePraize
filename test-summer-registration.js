// Simple test script for summer registration endpoints
const testData = {
  name: "Test User",
  email: "test@example.com", 
  phone: "555-123-4567",
  paymentId: "pi_test_123456"
};

// Test POST endpoint
fetch('http://localhost:3000/api/summer-registration', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('POST Response:', data);
  
  // Test GET endpoint
  return fetch('http://localhost:3000/api/summer-registrants');
})
.then(response => response.json())
.then(data => {
  console.log('GET Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
