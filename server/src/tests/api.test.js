import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { disconnectRedis } from '../config/redis.js';
import { env } from '../config/env.js';

describe('E-Commerce REST API Integration Tests', () => {
  let adminToken = '';
  let customerToken = '';
  let sampleProductId = '';

  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectRedis();
    await disconnectDB();
  });

  test('POST /api/v1/auth/login - Admin Login succeeds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'admin');
    assert.ok(res.body.data.accessToken);
    adminToken = res.body.data.accessToken;
  });

  test('POST /api/v1/auth/login - Customer Login succeeds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'Customer@123456',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'customer');
    customerToken = res.body.data.accessToken;
  });

  test('GET /api/v1/products - Returns paginated active products', async () => {
    const res = await request(app).get('/api/v1/products?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
    assert.ok(res.body.data.length > 0);
    sampleProductId = res.body.data[0]._id;
  });

  test('GET /api/v1/home - Returns comprehensive homepage sections', async () => {
    const res = await request(app).get('/api/v1/home');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.banners));
    assert.ok(Array.isArray(res.body.data.trending));
    assert.ok(Array.isArray(res.body.data.featured));
    assert.ok(Array.isArray(res.body.data.categories));
  });

  test('POST /api/v1/coupons/validate - Correctly validates discount coupon', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({
        code: 'WELCOME10',
        orderAmount: 100,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.discountValue, 10);
    assert.equal(res.body.data.discountAmount, 10);
  });

  test('Security: Non-admin cannot access admin dashboard stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Admin dashboard stats returns real aggregations for authorized admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.data.totalProducts === 'number');
    assert.ok(typeof res.body.data.totalRevenue === 'number');
    assert.ok(typeof res.body.data.totalOrders === 'number');
  });

  test('Cart & Order flow: Customer adds item to cart and checks out', async () => {
    // 1. Add to cart
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: sampleProductId,
        quantity: 1,
      });

    assert.equal(addRes.status, 200);
    assert.equal(addRes.body.success, true);

    // 2. Fetch cart
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(cartRes.status, 200);
    assert.ok(cartRes.body.data.items.length >= 1);
    assert.ok(cartRes.body.data.pricing.total > 0);

    // 3. Place order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '452 Elm Street',
          city: 'San Francisco',
          state: 'California',
          postalCode: '94102',
          phone: '+1 (555) 019-2831',
        },
        paymentMethod: 'cod',
      });

    assert.equal(orderRes.status, 201);
    assert.equal(orderRes.body.success, true);
    assert.ok(orderRes.body.data.orderNumber);
    assert.equal(orderRes.body.data.fulfillmentStatus, 'pending');
  });

  test('GET /health - Returns system health and cache engine status', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.ok(res.body.cache);
    assert.ok(['redis', 'memory-fallback'].includes(res.body.cache.mode));
  });

  test('Cache Acceleration: GET /api/v1/home serves cached responses with high speed', async () => {
    // Request 1: primes cache
    const res1 = await request(app).get('/api/v1/home');
    assert.equal(res1.status, 200);
    assert.ok(res1.headers['x-cache']);

    // Request 2: must be a cache HIT
    const res2 = await request(app).get('/api/v1/home');
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['x-cache'], 'HIT');
    assert.ok(res2.headers['x-cache-engine']);
  });

  test('Cache Invalidation: Product update purges cached product queries', async () => {
    // 1. Prime product cache
    const list1 = await request(app).get('/api/v1/products?limit=3');
    assert.equal(list1.status, 200);

    const list2 = await request(app).get('/api/v1/products?limit=3');
    assert.equal(list2.status, 200);
    assert.equal(list2.headers['x-cache'], 'HIT');

    // 2. Admin updates product status -> triggers cacheService.invalidateProducts()
    const patchRes = await request(app)
      .patch(`/api/v1/products/${sampleProductId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isTrending: true });
    assert.equal(patchRes.status, 200);

    // 3. Next product query must be a fresh cache MISS or fresh data
    const list3 = await request(app).get('/api/v1/products?limit=3');
    assert.equal(list3.status, 200);
    assert.equal(list3.headers['x-cache'], 'MISS');
  });
});

