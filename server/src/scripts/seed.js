import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { Banner } from '../models/Banner.js';
import { Coupon } from '../models/Coupon.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { env } from '../config/env.js';

const seedDatabase = async () => {
  try {
    if (env.IS_PRODUCTION) {
      throw new Error('Database seeding is disabled in production.');
    }

    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Cleaning old database collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),
      StoreSettings.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users (Admin & Customer)...');
    const admin = await User.create({
      name: 'System Administrator',
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'admin',
      phone: '+1 (555) 010-9999',
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Customer@123456',
      role: 'customer',
      phone: '+1 (555) 019-2831',
      addresses: [
        {
          fullName: 'John Doe',
          addressLine1: '452 Elm Street',
          addressLine2: 'Apt 4B',
          city: 'San Francisco',
          state: 'California',
          postalCode: '94102',
          country: 'United States',
          phone: '+1 (555) 019-2831',
          isDefault: true,
        },
      ],
    });

    console.log('[Seed] Seeding Categories...');
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Cutting edge electronics, premium audio, and devices',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      displayOrder: 1,
    });

    const smartphones = await Category.create({
      name: 'Smartphones & Audio',
      slug: 'smartphones-audio',
      description: 'Flagship mobile devices and high fidelity sound',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      parentCategory: electronics._id,
      displayOrder: 2,
    });

    const fashion = await Category.create({
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Contemporary designer clothing, footwear, and accessories',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
      displayOrder: 3,
    });

    const computing = await Category.create({
      name: 'Computers & Tech',
      slug: 'computers-tech',
      description: 'High performance ultrabooks, monitors, and workstation gear',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
      parentCategory: electronics._id,
      displayOrder: 4,
    });

    const homeLiving = await Category.create({
      name: 'Home & Lifestyle',
      slug: 'home-lifestyle',
      description: 'Modern minimalist furniture, ambient lighting, and kitchenware',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      displayOrder: 5,
    });

    console.log('[Seed] Seeding Brands...');
    const apple = await Brand.create({
      name: 'Apple',
      slug: 'apple',
      description: 'Think Different. Leading consumer electronics and computing.',
      logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80',
      websiteUrl: 'https://apple.com',
      displayOrder: 1,
    });

    const sony = await Brand.create({
      name: 'Sony',
      slug: 'sony',
      description: 'Pioneering world-class audio, optics, and imaging.',
      logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80',
      websiteUrl: 'https://sony.com',
      displayOrder: 2,
    });

    const nike = await Brand.create({
      name: 'Nike',
      slug: 'nike',
      description: 'Innovating performance athletic wear and urban sneakers.',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
      websiteUrl: 'https://nike.com',
      displayOrder: 3,
    });

    const bose = await Brand.create({
      name: 'Bose',
      slug: 'bose',
      description: 'Better sound through research and acoustic engineering.',
      logo: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=200&q=80',
      websiteUrl: 'https://bose.com',
      displayOrder: 4,
    });

    console.log('[Seed] Seeding Banners...');
    await Banner.create([
      {
        title: 'Next-Gen Wireless Acoustic Masters',
        subtitle: 'Experience industry-leading noise cancellation and spatial fidelity.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
        ctaLabel: 'Explore Sound',
        destinationUrl: '/shop?category=electronics',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Autumn Style Reimagined',
        subtitle: 'Effortless minimalism crafted with sustainable organic textiles.',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
        ctaLabel: 'Shop Collection',
        destinationUrl: '/shop?category=fashion-apparel',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Pro Creative Workstations',
        subtitle: 'Unbounded performance for software engineers and digital artists.',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80',
        ctaLabel: 'Discover Tech',
        destinationUrl: '/shop?category=computers-tech',
        displayOrder: 3,
        isActive: true,
      },
    ]);

    console.log('[Seed] Seeding Products...');
    const productsData = [
      {
        name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-headphones',
        description: 'Industry-leading noise canceling with two processors and 8 microphones. Magnificent sound quality with Hi-Res Audio and up to 30 hours of battery life with quick charging.',
        categoryId: smartphones._id,
        brandId: sony._id,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'SONY-WH1000-XM5',
        price: 349.99,
        compareAtPrice: 399.99,
        stockQuantity: 45,
        specifications: [
          { name: 'Driver Unit', value: '30mm, Dome type' },
          { name: 'Battery Life', value: '30 Hours' },
          { name: 'Bluetooth', value: 'Version 5.2' },
          { name: 'Weight', value: '250g' },
        ],
        variants: [
          { name: 'Color', option: 'Silver', sku: 'SONY-XM5-SLV', stockQuantity: 20 },
          { name: 'Color', option: 'Midnight Black', sku: 'SONY-XM5-BLK', stockQuantity: 25 },
        ],
        averageRating: 4.8,
        reviewCount: 38,
        isTrending: true,
        isFeatured: true,
        salesCount: 42,
        tags: ['audio', 'headphones', 'sony', 'wireless', 'bluetooth'],
      },
      {
        name: 'Apple MacBook Pro 16" M3 Max',
        slug: 'apple-macbook-pro-16-m3-max',
        description: 'The ultimate pro laptop. Featuring Liquid Retina XDR display, up to 22 hours of battery life, and the breathtaking speed of the M3 Max silicon.',
        categoryId: computing._id,
        brandId: apple._id,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'APL-MBP-16-M3',
        price: 2499.00,
        compareAtPrice: 2699.00,
        stockQuantity: 18,
        specifications: [
          { name: 'Processor', value: 'Apple M3 Max 14-core CPU' },
          { name: 'Memory', value: '36GB Unified RAM' },
          { name: 'Storage', value: '1TB Superfast SSD' },
          { name: 'Display', value: '16.2-inch Liquid Retina XDR' },
        ],
        averageRating: 4.9,
        reviewCount: 26,
        isTrending: true,
        isFeatured: true,
        salesCount: 15,
        tags: ['apple', 'laptop', 'macbook', 'workstation'],
      },
      {
        name: 'Nike Air Max 270 React Urban Sneakers',
        slug: 'nike-air-max-270-react',
        description: 'Nike Air Max 270 delivers unrivaled, all-day comfort. The sleek, running-inspired design roots you to Nike heritage with eye-catching modern lines.',
        categoryId: fashion._id,
        brandId: nike._id,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'NKE-AM270-RED',
        price: 159.99,
        compareAtPrice: 179.99,
        stockQuantity: 32,
        specifications: [
          { name: 'Upper Material', value: 'Breathable Knit Mesh' },
          { name: 'Sole', value: 'React Foam + Max Air 270' },
          { name: 'Category', value: 'Lifestyle Running' },
        ],
        variants: [
          { name: 'Size', option: 'US 9', sku: 'NKE-AM270-9', stockQuantity: 10 },
          { name: 'Size', option: 'US 10', sku: 'NKE-AM270-10', stockQuantity: 12 },
          { name: 'Size', option: 'US 11', sku: 'NKE-AM270-11', stockQuantity: 10 },
        ],
        averageRating: 4.7,
        reviewCount: 19,
        isTrending: true,
        isFeatured: false,
        salesCount: 55,
        tags: ['shoes', 'sneakers', 'nike', 'sportswear', 'fashion'],
      },
      {
        name: 'Bose QuietComfort Ultra Wireless Earbuds',
        slug: 'bose-quietcomfort-ultra-earbuds',
        description: 'Groundbreaking spatial audio for more immersive listening. World-class quiet with CustomTune technology that personalizes noise cancellation to your ears.',
        categoryId: smartphones._id,
        brandId: bose._id,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'BOS-QCU-EAR',
        price: 299.00,
        compareAtPrice: 329.00,
        stockQuantity: 25,
        specifications: [
          { name: 'Water Resistance', value: 'IPX4 sweat resistant' },
          { name: 'Battery', value: '6 hours (24 with case)' },
          { name: 'Connectivity', value: 'Bluetooth 5.3 aptX' },
        ],
        averageRating: 4.6,
        reviewCount: 14,
        isTrending: false,
        isFeatured: true,
        salesCount: 28,
        tags: ['audio', 'earbuds', 'bose', 'wireless', 'noise-cancelling'],
      },
      {
        name: 'Minimalist Walnut Executive Desk Lamp',
        slug: 'minimalist-walnut-executive-desk-lamp',
        description: 'Architectural precision meets warm Scandinavian woodcraft. Features 3-stage touch dimming, 4000K daylight LED, and integrated wireless charging base.',
        categoryId: homeLiving._id,
        brandId: null,
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'HME-LMP-WLT01',
        price: 89.99,
        compareAtPrice: 119.99,
        stockQuantity: 40,
        specifications: [
          { name: 'Material', value: 'Solid American Walnut & Anodized Brass' },
          { name: 'Power', value: '12W High-CRI LED' },
          { name: 'Wireless Charging', value: '15W Qi Fast Charge' },
        ],
        averageRating: 4.5,
        reviewCount: 8,
        isTrending: false,
        isFeatured: false,
        salesCount: 19,
        tags: ['home', 'lamp', 'decor', 'lighting', 'lifestyle'],
      },
      {
        name: 'Apple iPhone 16 Pro Max 256GB',
        slug: 'apple-iphone-16-pro-max',
        description: 'Titanium design with larger 6.9-inch Super Retina XDR display, Camera Control, 4K 120 fps Dolby Vision, and the power of the A18 Pro chip.',
        categoryId: smartphones._id,
        brandId: apple._id,
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
        ],
        SKU: 'APL-IPHONE-16PM',
        price: 1199.00,
        compareAtPrice: 1299.00,
        stockQuantity: 8, // Low stock product for dashboard demonstration!
        specifications: [
          { name: 'Display', value: '6.9" OLED 120Hz ProMotion' },
          { name: 'Chip', value: 'A18 Pro' },
          { name: 'Storage', value: '256GB' },
          { name: 'Chassis', value: 'Grade 5 Titanium' },
        ],
        averageRating: 4.9,
        reviewCount: 45,
        isTrending: true,
        isFeatured: true,
        salesCount: 68,
        tags: ['apple', 'smartphone', 'iphone', 'flagship'],
      },
    ];

    const seededProducts = await Product.create(productsData);

    console.log('[Seed] Seeding Reviews...');
    await Review.create([
      {
        product: seededProducts[0]._id,
        user: customer._id,
        rating: 5,
        title: 'Outstanding sound quality and ANC',
        comment: 'These headphones exceed all expectations. Noise cancellation in airplanes and cafes is surreal, and battery easily lasts 3 full days of heavy usage.',
        isVerifiedPurchase: true,
        status: 'approved',
      },
      {
        product: seededProducts[1]._id,
        user: customer._id,
        rating: 5,
        title: 'Unbelievable power for development',
        comment: 'Docker containers, full stack builds, and multiple IDEs run simultaneously with zero thermal throttling. The Liquid Retina display is gorgeous.',
        isVerifiedPurchase: true,
        status: 'approved',
      },
    ]);

    console.log('[Seed] Seeding Coupons...');
    await Coupon.create([
      {
        code: 'WELCOME10',
        description: '10% off your entire first purchase',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 30,
        maxDiscountAmount: 50,
        usageLimit: 500,
        isActive: true,
      },
      {
        code: 'SAVE20',
        description: 'Save $20 on premium orders over $150',
        discountType: 'fixed',
        discountValue: 20,
        minOrderAmount: 150,
        usageLimit: 200,
        isActive: true,
      },
      {
        code: 'VIP50',
        description: 'Special $50 promotional coupon on purchases over $300',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 300,
        usageLimit: 100,
        isActive: true,
      },
    ]);

    console.log('[Seed] Seeding Store Settings...');
    await StoreSettings.create({
      storeName: 'NovaStore',
      tagline: 'Premium Electronics, Modern Living & Designer Essentials',
      contactEmail: 'support@novastore.com',
      contactPhone: '+1 (800) 555-0199',
      address: '742 Evergreen Terrace, Silicon Valley, CA 94025',
      currency: { code: 'USD', symbol: '$' },
      shipping: { freeShippingThreshold: 50, standardShippingFee: 10 },
      paymentMethods: { cod: true, card: true, upi: true, netbanking: true },
      announcement: {
        enabled: true,
        message: 'Free Express Shipping on orders over $50! Use coupon code WELCOME10 for 10% off.',
      },
    });

    console.log('[Seed] Seeding Initial Demo Orders for Real Dashboard Aggregations...');
    await Order.create([
      {
        orderNumber: 'ORD-20261011-DEMO1',
        user: customer._id,
        items: [
          {
            product: seededProducts[0]._id,
            name: seededProducts[0].name,
            image: seededProducts[0].images[0],
            sku: seededProducts[0].SKU,
            price: seededProducts[0].price,
            quantity: 1,
            total: seededProducts[0].price,
          },
        ],
        shippingAddress: customer.addresses[0],
        pricing: {
          subtotal: 349.99,
          discount: 34.99,
          shippingCharge: 0,
          total: 315.00,
        },
        coupon: { code: 'WELCOME10', discountAmount: 34.99 },
        payment: {
          method: 'card',
          status: 'completed',
          transactionId: 'TXN-DEMO-001',
          paidAt: new Date(Date.now() - 86400000 * 2),
        },
        fulfillmentStatus: 'delivered',
        timeline: [
          { status: 'pending', note: 'Order placed', timestamp: new Date(Date.now() - 86400000 * 2) },
          { status: 'delivered', note: 'Package delivered safely', timestamp: new Date(Date.now() - 86400000 * 1) },
        ],
      },
      {
        orderNumber: 'ORD-20261011-DEMO2',
        user: customer._id,
        items: [
          {
            product: seededProducts[2]._id,
            name: seededProducts[2].name,
            image: seededProducts[2].images[0],
            sku: seededProducts[2].SKU,
            price: seededProducts[2].price,
            quantity: 2,
            total: seededProducts[2].price * 2,
          },
        ],
        shippingAddress: customer.addresses[0],
        pricing: {
          subtotal: 319.98,
          discount: 20.00,
          shippingCharge: 0,
          total: 299.98,
        },
        coupon: { code: 'SAVE20', discountAmount: 20.00 },
        payment: {
          method: 'cod',
          status: 'pending',
          transactionId: '',
        },
        fulfillmentStatus: 'processing',
        timeline: [
          { status: 'pending', note: 'Order placed with Cash on Delivery', timestamp: new Date() },
          { status: 'processing', note: 'Order is being packaged at fulfilment center', timestamp: new Date() },
        ],
      },
    ]);

    console.log('[Seed] Database seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log(` Admin Credentials: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
    console.log(` Customer Demo   : john@example.com / Customer@123456`);
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
