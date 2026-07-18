import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding database...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.config.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('Database cleaned.');

  // 2. Create Tenants (Restaurants)
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Baltium Gastrobar',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&h=120&q=80',
      primaryColor: '#0f172a', // Dark Slate
      secondaryColor: '#10b981', // Emerald Accent
      domain: 'gastrobar-baltium.com',
      schedule: JSON.stringify([
        { day: 'Monday', open: '12:00', close: '23:00' },
        { day: 'Tuesday', open: '12:00', close: '23:00' },
        { day: 'Wednesday', open: '12:00', close: '23:00' },
        { day: 'Thursday', open: '12:00', close: '23:00' },
        { day: 'Friday', open: '12:00', close: '01:00' },
        { day: 'Saturday', open: '12:00', close: '01:00' },
        { day: 'Sunday', open: '12:00', close: '22:00' }
      ]),
      tableCount: 10,
      capacity: 40,
      configuration: JSON.stringify({
        metaPixelId: 'pixel_123456',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        whatsappEnabled: true,
        smtpHost: 'smtp.mailtrap.io'
      })
    }
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Café Central',
      logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=120&h=120&q=80',
      primaryColor: '#78350f', // Warm Amber
      secondaryColor: '#d97706', // Gold Accent
      domain: 'cafe-central.com',
      schedule: JSON.stringify([
        { day: 'All days', open: '08:00', close: '20:00' }
      ]),
      tableCount: 6,
      capacity: 24,
      configuration: JSON.stringify({
        whatsappEnabled: false
      })
    }
  });

  console.log('Tenants seeded.');

  // 3. Create Users with standard roles
  const passwordHash = await bcrypt.hash('password123', 10);

  // Super Admin (No tenant, controls system)
  await prisma.user.create({
    data: {
      email: 'superadmin@baltium.com',
      passwordHash,
      firstName: 'Andrea',
      lastName: 'Super',
      role: 'SUPER_ADMIN',
      phone: '+1555000000',
      isVerified: true
    }
  });

  // Users for Tenant 1 (Baltium Gastrobar)
  const adminT1 = await prisma.user.create({
    data: {
      email: 'admin@baltium.com',
      passwordHash,
      firstName: 'Alejandro',
      lastName: 'Gómez',
      role: 'ADMIN',
      phone: '+34600111222',
      tenantId: tenant1.id,
      isVerified: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'reception@baltium.com',
      passwordHash,
      firstName: 'Sofía',
      lastName: 'Sanz',
      role: 'RECEPTION',
      phone: '+34600222333',
      tenantId: tenant1.id,
      isVerified: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'waiter@baltium.com',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Ruiz',
      role: 'WAITER',
      phone: '+34600333444',
      tenantId: tenant1.id,
      isVerified: true
    }
  });

  // User for Tenant 2 (Café Central)
  await prisma.user.create({
    data: {
      email: 'cafeadmin@baltium.com',
      passwordHash,
      firstName: 'Lucía',
      lastName: 'Martín',
      role: 'ADMIN',
      phone: '+34600444555',
      tenantId: tenant2.id,
      isVerified: true
    }
  });

  console.log('Users seeded.');

  // 4. Create Tables for Tenant 1 (Baltium Gastrobar)
  // We specify positions (x, y) for layout drag & drop grid (out of 1000px canvas size)
  const tablesT1 = [
    { name: 'Mesa 1', capacity: 2, zone: 'MAIN', x: 100, y: 100, width: 80, height: 80, shape: 'round', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 2', capacity: 4, zone: 'MAIN', x: 250, y: 100, width: 120, height: 80, shape: 'rectangular', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 3', capacity: 4, zone: 'MAIN', x: 450, y: 100, width: 120, height: 80, shape: 'rectangular', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 4', capacity: 6, zone: 'MAIN', x: 100, y: 250, width: 150, height: 90, shape: 'rectangular', tenantId: tenant1.id, status: 'RESERVED' },
    { name: 'Mesa 5', capacity: 2, zone: 'BAR', x: 700, y: 100, width: 60, height: 60, shape: 'round', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 6', capacity: 2, zone: 'BAR', x: 700, y: 200, width: 60, height: 60, shape: 'round', tenantId: tenant1.id, status: 'OCCUPIED' },
    { name: 'Mesa 7', capacity: 4, zone: 'TERRACE', x: 100, y: 450, width: 100, height: 100, shape: 'rectangular', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 8', capacity: 4, zone: 'TERRACE', x: 250, y: 450, width: 100, height: 100, shape: 'rectangular', tenantId: tenant1.id, status: 'CLEANING' },
    { name: 'Mesa 9', capacity: 8, zone: 'VIP', x: 450, y: 450, width: 180, height: 100, shape: 'rectangular', tenantId: tenant1.id, status: 'AVAILABLE' },
    { name: 'Mesa 10', capacity: 4, zone: 'VIP', x: 700, y: 450, width: 100, height: 100, shape: 'round', tenantId: tenant1.id, status: 'OUT_OF_SERVICE' }
  ];

  for (const table of tablesT1) {
    await prisma.table.create({ data: table });
  }

  // Create Tables for Tenant 2 (Café Central)
  const tablesT2 = [
    { name: 'C1', capacity: 2, zone: 'MAIN', x: 150, y: 150, width: 80, height: 80, shape: 'round', tenantId: tenant2.id, status: 'AVAILABLE' },
    { name: 'C2', capacity: 4, zone: 'MAIN', x: 300, y: 150, width: 100, height: 80, shape: 'rectangular', tenantId: tenant2.id, status: 'AVAILABLE' },
    { name: 'C3', capacity: 4, zone: 'TERRACE', x: 150, y: 350, width: 90, height: 90, shape: 'rectangular', tenantId: tenant2.id, status: 'AVAILABLE' },
    { name: 'C4', capacity: 2, zone: 'TERRACE', x: 300, y: 350, width: 80, height: 80, shape: 'round', tenantId: tenant2.id, status: 'AVAILABLE' }
  ];

  for (const table of tablesT2) {
    await prisma.table.create({ data: table });
  }

  console.log('Tables seeded.');

  // Get some of the created tables for assigning reservations
  const dbTablesT1 = await prisma.table.findMany({ where: { tenantId: tenant1.id } });
  const table4 = dbTablesT1.find(t => t.name === 'Mesa 4')!;
  const table6 = dbTablesT1.find(t => t.name === 'Mesa 6')!;

  // 5. Create Clients (CRM) for Tenant 1
  const client1 = await prisma.client.create({
    data: {
      name: 'Marta Sánchez',
      phone: '+34611222333',
      email: 'marta.sanchez@gmail.com',
      birthday: new Date('1992-05-15'),
      anniversary: new Date('2018-09-20'),
      notes: 'Prefiere mesas tranquilas. Alérgica a los frutos secos.',
      tags: JSON.stringify(['VIP', 'Frecuente']),
      isVip: true,
      tenantId: tenant1.id
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Javier López',
      phone: '+34622333444',
      email: 'javier.lopez@yahoo.com',
      birthday: new Date('1985-11-03'),
      notes: 'Suele pedir vinos tintos premium.',
      tags: JSON.stringify(['Frecuente']),
      isVip: false,
      tenantId: tenant1.id
    }
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Roberto Gómez',
      phone: '+34633444555',
      email: 'roberto.gomez@hotmail.com',
      tags: JSON.stringify(['Nuevo']),
      isVip: false,
      tenantId: tenant1.id
    }
  });

  console.log('Clients seeded.');

  // 6. Create Reservations for Tenant 1
  const today = new Date();
  
  // Reservation 1: Today, soon (reserved Mesa 4)
  const timeToday = new Date(today);
  timeToday.setHours(14, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      clientName: client1.name,
      clientPhone: client1.phone,
      clientEmail: client1.email,
      dateTime: timeToday,
      partySize: 4,
      zone: 'MAIN',
      status: 'CONFIRMED',
      celebration: 'ANNIVERSARY',
      notes: 'Aniversario de bodas de los clientes.',
      tableId: table4.id,
      tenantId: tenant1.id,
      clientId: client1.id
    }
  });

  // Reservation 2: Today, current seating (occupied Mesa 6)
  const timePastToday = new Date(today);
  timePastToday.setHours(today.getHours() - 1, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      clientName: client2.name,
      clientPhone: client2.phone,
      clientEmail: client2.email,
      dateTime: timePastToday,
      partySize: 2,
      zone: 'BAR',
      status: 'CONFIRMED',
      notes: 'Sentado en barra',
      tableId: table6.id,
      tenantId: tenant1.id,
      clientId: client2.id
    }
  });

  // Reservation 3: Future booking tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(21, 30, 0, 0);

  await prisma.reservation.create({
    data: {
      clientName: 'Ana Belén',
      clientPhone: '+34699888777',
      clientEmail: 'anabelen@outlook.com',
      dateTime: tomorrow,
      partySize: 6,
      zone: 'VIP',
      status: 'PENDING',
      celebration: 'BIRTHDAY',
      notes: 'Llevarán pastel propio.',
      tenantId: tenant1.id
    }
  });

  // Reservation 4: Past completed reservation
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(21, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      clientName: client3.name,
      clientPhone: client3.phone,
      clientEmail: client3.email,
      dateTime: yesterday,
      partySize: 3,
      zone: 'MAIN',
      status: 'COMPLETED',
      tenantId: tenant1.id,
      clientId: client3.id
    }
  });

  console.log('Reservations seeded.');

  // 7. Create Waitlist entry for Tenant 1
  await prisma.waitlist.create({
    data: {
      clientName: 'Daniel Jiménez',
      clientPhone: '+34655444333',
      clientEmail: 'daniel@outlook.es',
      partySize: 4,
      zone: 'MAIN',
      notes: 'Desea mesa en la ventana a ser posible.',
      tenantId: tenant1.id
    }
  });

  // 8. Create Config records for Tenant 1
  await prisma.config.create({
    data: {
      key: 'stripe_public_key',
      value: 'pk_test_baltium_res_51O',
      tenantId: tenant1.id
    }
  });

  await prisma.config.create({
    data: {
      key: 'stripe_secret_key',
      value: 'sk_test_baltium_res_51O',
      tenantId: tenant1.id
    }
  });

  // 9. Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminT1.id,
      action: 'TENANT_SEEDED',
      details: JSON.stringify({ message: 'Database initial seeding successful' }),
      ipAddress: '127.0.0.1',
      tenantId: tenant1.id
    }
  });

  // 10. Seeding Menu Items for Baltium Gastrobar
  const menuT1 = [
    { name: 'Croquetas de Jamón Ibérico', description: 'Croquetas cremosas con virutas de jamón ibérico de bellota. Ración de 8 unidades.', price: 28000, category: 'ENTRADA', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Ensalada Burrata y Tomates Rústicos', description: 'Burrata de búfala fresca, mix de tomates confitados, pesto casero de albahaca y piñones.', price: 32000, category: 'ENTRADA', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Solomillo de Ternera al Whisky', description: 'Tierno solomillo de ternera a la parrilla con salsa de whisky añejo y patatas panaderas.', price: 58000, category: 'PLATO_FUERTE', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Pulpo a la Brasa con Parmentier', description: 'Patas de pulpo asadas al carbón, pimentón de la Vera, aceite de oliva virgen extra y parmentier de patata.', price: 52000, category: 'PLATO_FUERTE', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Tarta de Queso Baltium', description: 'Tarta de queso al estilo vasco, horneada diariamente, cremosa en su centro.', price: 18000, category: 'POSTRE', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Copa de Vino Tinto Crianza', description: 'Vino tinto D.O. Rioja, envejecido en barricas de roble americano.', price: 14000, category: 'BEBIDA', tenantId: tenant1.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=250&h=180&q=80' }
  ];

  for (const item of menuT1) {
    await prisma.menuItem.create({ data: item });
  }

  // Seeding Menu Items for Café Central
  const menuT2 = [
    { name: 'Café Cappuccino', description: 'Café espresso con leche espumada y espolvoreado con cacao fino.', price: 8000, category: 'BEBIDA', tenantId: tenant2.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=250&h=180&q=80' },
    { name: 'Tarta de Zanahoria', description: 'Deliciosa tarta de zanahoria con glaseado de queso crema.', price: 12000, category: 'POSTRE', tenantId: tenant2.id, available: true, imageUrl: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=250&h=180&q=80' }
  ];

  for (const item of menuT2) {
    await prisma.menuItem.create({ data: item });
  }

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
