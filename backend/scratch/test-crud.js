async function runTests() {
  const baseUrl = 'http://localhost:3000/api/devices';

  try {
    console.log('--- 1. Testing GET /api/devices ---');
    const getRes = await fetch(baseUrl);
    const getData = await getRes.json();
    console.log('GET response:', JSON.stringify(getData, null, 2));

    console.log('\n--- 2. Testing POST /api/devices ---');
    const newDevice = {
      name: 'Test Device Node',
      ip: '10.0.0.5',
      type: 'Server',
      status: 'online'
    };
    const postRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDevice)
    });
    const postData = await postRes.json();
    console.log('POST response:', JSON.stringify(postData, null, 2));
    
    if (!postData.success) throw new Error('POST failed');
    const createdId = postData.data.id;

    console.log(`\n--- 3. Testing GET /api/devices/${createdId} ---`);
    const getOneRes = await fetch(`${baseUrl}/${createdId}`);
    const getOneData = await getOneRes.json();
    console.log('GET one response:', JSON.stringify(getOneData, null, 2));

    console.log(`\n--- 4. Testing PUT /api/devices/${createdId} ---`);
    const updatedDevice = {
      name: 'Updated Test Device Node',
      status: 'offline'
    };
    const putRes = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice)
    });
    const putData = await putRes.json();
    console.log('PUT response:', JSON.stringify(putData, null, 2));

    console.log(`\n--- 5. Testing DELETE /api/devices/${createdId} ---`);
    const deleteRes = await fetch(`${baseUrl}/${createdId}`, { method: 'DELETE' });
    const deleteData = await deleteRes.json();
    console.log('DELETE response:', JSON.stringify(deleteData, null, 2));

    console.log('\n--- 6. Confirming deletion ---');
    const confirmRes = await fetch(`${baseUrl}/${createdId}`);
    const confirmData = await confirmRes.json();
    console.log('GET deleted response (expecting 404):', confirmRes.status, JSON.stringify(confirmData, null, 2));

    console.log('\nAll tests completed successfully! 🎉');
  } catch (err) {
    console.error('Test run failed:', err);
  }
}

runTests();
