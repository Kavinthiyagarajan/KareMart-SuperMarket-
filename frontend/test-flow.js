const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080/api/v1';

async function run() {
  console.log('--- STARTING BACKEND SMOKE TEST ---');
  try {
    const ts = Date.now();
    const custUser = 'testcust' + ts;
    const adminUser = 'admin1';

    // 1. Register Customer
    let res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: custUser, password: 'password', role: 'CUSTOMER' })
    });
    console.log('Register Customer:', res.status);
    
    // 2. Login Customer
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: custUser, password: 'password' })
    });
    let data = await res.json();
    console.log('Login Customer:', res.status, data.token ? 'Got Token' : data);
    const token = data.token;
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 3. Login Admin (Pre-seeded by DataSeeder: admin/password)
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    if (!res.ok) {
      console.log('Admin Login Failed:', res.status, await res.text());
      return;
    }
    data = await res.json();
    const adminToken = data.token;
    const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

    // 5. Admin creates a product
    res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Smoke Test Product',
        slug: 'smoke-test-product',
        sku: 'SMK-001',
        externalId: 'ext-smk-001',
        barcode: '123456789',
        mrp: 100,
        sellingPrice: 90,
        availableQuantity: 20,
        categoryId: 1
      })
    });
    if (!res.ok) {
      console.log('Admin Create Product Failed:', res.status, await res.text());
      return;
    }
    const product = await res.json();
    console.log('Admin Create Product:', res.status, product.id ? `ID: ${product.id}` : product);

    // 6. Customer adds to cart
    if (product.id) {
      res = await fetch(`${API_BASE}/cart/items?productId=${product.id}&quantity=3`, {
        method: 'POST',
        headers: authHeaders
      });
      console.log('Customer Add to Cart:', res.status, await res.text());

      // 7. Customer views cart
      res = await fetch(`${API_BASE}/cart`, {
        headers: authHeaders
      });
      console.log('Customer View Cart:', res.status, await res.json());

      // 7.5 Customer creates an address
      res = await fetch(`${API_BASE}/profile/addresses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'HOME',
          recipientName: 'Test Customer',
          phoneNumber: '9876543210',
          addressLine1: '123 Market St',
          city: 'Bangalore',
          state: 'Karnataka',
          pinCode: '560001',
          isDefault: true
        })
      });
      const address = await res.json();
      console.log('Customer Create Address:', res.status, address.id ? `ID: ${address.id}` : address);
      
      // 8. Checkout Mock Payment
      res = await fetch(`${API_BASE}/checkout/validate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ addressId: address.id, items: [{ productId: product.id, quantity: 3 }] })
      });
      console.log('Checkout Validate:', res.status, await res.json());

      // 9. Place Order
      res = await fetch(`${API_BASE}/checkout/place-order`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ addressId: address.id, items: [{ productId: product.id, quantity: 3 }] })
      });
      const orderRes = await res.json();
      console.log('Place Order:', res.status, orderRes);
      
      const orderNumber = orderRes.orderNumber;
      if (orderNumber) {
        // 10. Admin Check Stock Audit
        res = await fetch(`${API_BASE}/admin/inventory/history?productId=${product.id}`, {
          headers: adminHeaders
        });
        console.log('Inventory Audit:', res.status, await res.json());

        // 11. Mock Payment Verify (To commit reservation)
        // Usually checkout returns total, so let's fetch payment config and mock
        res = await fetch(`${API_BASE}/payments/create`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ orderNumber, paymentMethod: 'COD', idempotencyKey: 'test-123' })
        });
        console.log('Payment Create:', res.status, await res.json());
      }
    }

  } catch (err) {
    console.error('Test Failed:', err);
  }
}
run();
