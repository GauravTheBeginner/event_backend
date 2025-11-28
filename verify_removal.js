import prisma from './src/db/client.js';
import { createEvent, getEventById } from './src/services/event.service.js';

async function verify() {
  console.log('Starting verification for eventId removal...');

  const testUser = await prisma.user.findFirst();
  if (!testUser) {
    console.error('No user found for testing. Please create a user first.');
    process.exit(1);
  }

  // Test 1: Create event and check structure
  console.log('\nTest 1: Create event');
  const eventData = {
    eventName: 'Test Event No ID',
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
    source: 'test'
  };

  try {
    const result = await createEvent(testUser.id, eventData);
    if (result.success && result.event.id) {
      console.log('✅ Test 1 Passed: Event created with UUID id:', result.event.id);
      if (result.event.eventId) {
        console.error('❌ Test 1 Failed: eventId field still exists!');
      } else {
        console.log('✅ Test 1 Passed: eventId field is gone.');
      }
      
      // Test 2: Get event by ID
      console.log('\nTest 2: Get event by ID');
      const fetched = await getEventById(result.event.id);
      if (fetched.success && fetched.event.id === result.event.id) {
        console.log('✅ Test 2 Passed: Fetched event by UUID');
      } else {
        console.error('❌ Test 2 Failed: Could not fetch event by UUID');
      }

    } else {
      console.error('❌ Test 1 Failed:', result);
    }
  } catch (error) {
    console.error('❌ Test 1 Error:', error);
  }

  // Cleanup
  console.log('\nCleaning up...');
  await prisma.event.deleteMany({
    where: {
      eventName: 'Test Event No ID'
    }
  });
  console.log('Cleanup done.');
}

verify()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
