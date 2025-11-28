import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3000';

async function testBulkUpload() {
  console.log('Starting CSV bulk upload test...\n');

  try {
    // Step 1: Login or get a token
    console.log('Step 1: Authenticating...');
    
    // Request OTP
    const otpResponse = await fetch(`${API_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    const otpData = await otpResponse.json();
    console.log('OTP Response:', otpData);
    
    if (!otpData.success) {
      console.log('Creating user account first...');
      // Note: In production, you'd need to verify OTP. For testing, check your email or logs.
      console.log('Please check logs for OTP code and update this script.');
      console.log('Assuming you have a valid token, update the token variable below.');
      return;
    }

    // For testing purposes, you'll need to manually get the token
    // You can get this by:
    // 1. Checking email for OTP
    // 2. Calling verify-otp endpoint
    // 3. Using the returned token
    
    console.log('\n⚠️  Manual step required:');
    console.log('1. Check your email/logs for the OTP code');
    console.log('2. Call POST /api/auth/verify-otp with email and otpCode');
    console.log('3. Copy the token from the response');
    console.log('4. Update this script with the token\n');
    
    const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('Please update the token in this script first.');
      return;
    }

    // Step 2: Upload CSV
    console.log('Step 2: Uploading CSV file...');
    
    const formData = new FormData();
    const csvPath = path.join(__dirname, 'test_events.csv');
    formData.append('csvFile', fs.createReadStream(csvPath));
    
    const uploadResponse = await fetch(`${API_URL}/events/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('\nUpload Result:');
    console.log(JSON.stringify(uploadResult, null, 2));
    
    if (uploadResult.success) {
      console.log('\n✅ Bulk upload successful!');
      console.log(`✅ Created: ${uploadResult.results.successful.length} events`);
      console.log(`❌ Failed: ${uploadResult.results.failed.length} events`);
      
      if (uploadResult.results.successful.length > 0) {
        console.log('\nSuccessful events:');
        uploadResult.results.successful.forEach(e => {
          console.log(`  - Row ${e.row}: ${e.eventName} (ID: ${e.eventId})`);
        });
      }
      
      if (uploadResult.results.failed.length > 0) {
        console.log('\nFailed events:');
        uploadResult.results.failed.forEach(e => {
          console.log(`  - Row ${e.row}: ${e.eventName} - ${e.error}`);
        });
      }
    } else {
      console.log('\n❌ Upload failed:', uploadResult.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBulkUpload();
