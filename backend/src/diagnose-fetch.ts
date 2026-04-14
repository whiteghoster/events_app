async function testFetch() {
  const id = '6d42540f-aa2b-4a0b-89a5-4128a7e0f853';
  try {
    console.log('--- Diagnosing Fetch ---');
    console.log(`Target URL: http://localhost:3002/events/${id}`);
    
    const res = await fetch(`http://localhost:3002/events/${id}`);
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    
    const json = await res.json().catch(() => ({}));
    console.log('Response Body:', JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error('Fetch Failed:', err.message);
    if (err.cause) console.error('Cause:', err.cause);
  }
}

testFetch();
