import prisma from './src/db/client.js';
import { bulkCreateEvents } from './src/services/event.service.js';

async function verify() {
  console.log('Starting verification for bulk upload bookingUrl...');

  const testUser = await prisma.user.findFirst();
  if (!testUser) {
    console.error('No user found for testing.');
    process.exit(1);
  }

  // Mock CSV data as parsed by csv-parse
  const mockRecords = [
    {
      eventName: 'Test Bulk URL 1',
      eventDescription: 'Description',
      eventType: 'Conference',
      eventLocation: 'Online',
      locationDataPCityName: 'New York',
      locationDataPStateKey: 'NY',
      eventPlaceAddress: '123 St',
      eventPlaceName: 'Virtual',
      eventAggregateOfferOfferPrice: '100',
      duration: '2h',
      ticketsNeededFor: 'Everyone',
      image: 'https://example.com/image.jpg',
      bookingUrl: 'https://example.com/book-1' // Explicit URL
    },
    {
      eventName: 'Test Bulk URL 2',
      eventDescription: 'Description',
      eventType: 'Conference',
      eventLocation: 'Online',
      locationDataPCityName: 'New York',
      locationDataPStateKey: 'NY',
      eventPlaceAddress: '123 St',
      eventPlaceName: 'Virtual',
      eventAggregateOfferOfferPrice: '100',
      duration: '2h',
      ticketsNeededFor: 'Everyone',
      image: 'https://example.com/image.jpg',
      bookingUrl: '' // Empty string
    }
  ];

  try {
    const result = await bulkCreateEvents(testUser.id, mockRecords);
    console.log('Bulk create result:', result);

    // Verify in DB
    const events = await prisma.event.findMany({
      where: {
        eventName: { in: ['Test Bulk URL 1', 'Test Bulk URL 2'] }
      }
    });

    events.forEach(event => {
      console.log(`Event: ${event.eventName}, Booking URL: '${event.bookingUrl}'`);
      if (event.eventName === 'Test Bulk URL 1' && event.bookingUrl !== 'https://example.com/book-1') {
        console.error('❌ Test 1 Failed: Booking URL missing or incorrect');
      } else if (event.eventName === 'Test Bulk URL 2' && event.bookingUrl !== '') {
        console.error('❌ Test 2 Failed: Booking URL should be empty string but is:', event.bookingUrl);
      } else {
        console.log('✅ Test Passed');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Cleanup
  console.log('\nCleaning up...');
  await prisma.event.deleteMany({
    where: {
      eventName: { in: ['Test Bulk URL 1', 'Test Bulk URL 2'] }
    }
  });
  console.log('Cleanup done.');
}

verify()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
