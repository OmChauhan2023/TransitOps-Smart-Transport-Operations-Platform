import bcrypt from 'bcrypt';
import prisma from './config/db';

async function main() {
  console.log('Starting TransitOps seed...');

  const password_hash = await bcrypt.hash('password123', 10);

  // 1. Create Users for all 4 Roles
  const users = [
    {
      name: 'Om Chauhan (Fleet Manager)',
      email: 'fleet@transitops.com',
      password_hash,
      role: 'FleetManager' as const,
    },
    {
      name: 'Jaimin Dispatcher',
      email: 'dispatcher@transitops.com',
      password_hash,
      role: 'Dispatcher' as const,
    },
    {
      name: 'Sarah Safety Officer',
      email: 'safety@transitops.com',
      password_hash,
      role: 'SafetyOfficer' as const,
    },
    {
      name: 'Alex Financial Analyst',
      email: 'finance@transitops.com',
      password_hash,
      role: 'FinancialAnalyst' as const,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password_hash: u.password_hash },
      create: u,
    });
  }
  console.log('✓ Seeded 4 operational users.');

  // 2. Create Vehicles
  const vehiclesData = [
    {
      name: 'Freightliner Cascadia',
      reg_number: 'TRK-101',
      type: 'Heavy Truck' as const,
      max_load: 18000,
      load_unit: 'kg' as const,
      odometer: 124500,
      acquisition_cost: 145000,
      status: 'Available' as const,
      region: 'North',
    },
    {
      name: 'Volvo FH16 Semi',
      reg_number: 'TRK-102',
      type: 'Heavy Truck' as const,
      max_load: 22000,
      load_unit: 'kg' as const,
      odometer: 89000,
      acquisition_cost: 160000,
      status: 'Available' as const,
      region: 'West',
    },
    {
      name: 'Mercedes-Benz Sprinter',
      reg_number: 'VAN-201',
      type: 'Van' as const,
      max_load: 1500,
      load_unit: 'kg' as const,
      odometer: 45200,
      acquisition_cost: 55000,
      status: 'Available' as const,
      region: 'North',
    },
    {
      name: 'Ford Transit Express',
      reg_number: 'VAN-202',
      type: 'Van' as const,
      max_load: 1200,
      load_unit: 'kg' as const,
      odometer: 61000,
      acquisition_cost: 48000,
      status: 'InShop' as const,
      region: 'South',
    },
  ];

  const createdVehicles: Record<string, any> = {};
  for (const v of vehiclesData) {
    const created = await prisma.vehicle.upsert({
      where: { reg_number: v.reg_number },
      update: v,
      create: v,
    });
    createdVehicles[v.reg_number] = created;
  }
  console.log('✓ Seeded vehicles.');

  // 3. Create Drivers
  const driversData = [
    {
      name: 'Carlos Rodriguez',
      license_number: 'LIC-9901',
      license_category: 'Heavy CDL-A',
      license_expiry: new Date('2028-06-15'),
      contact: '+1-555-0101',
      trip_completion_pct: 98.5,
      safety_score: 96.0,
      status: 'Available' as const,
    },
    {
      name: 'Emily Watson',
      license_number: 'LIC-9902',
      license_category: 'Standard CDL-B',
      license_expiry: new Date('2027-11-20'),
      contact: '+1-555-0102',
      trip_completion_pct: 99.2,
      safety_score: 99.0,
      status: 'Available' as const,
    },
    {
      name: 'Marcus Vance',
      license_number: 'LIC-9903',
      license_category: 'Heavy CDL-A',
      license_expiry: new Date('2026-10-10'),
      contact: '+1-555-0103',
      trip_completion_pct: 92.0,
      safety_score: 84.5,
      status: 'Available' as const,
    },
  ];

  for (const d of driversData) {
    await prisma.driver.upsert({
      where: { license_number: d.license_number },
      update: d,
      create: d,
    });
  }
  console.log('✓ Seeded drivers.');

  // 4. Create Maintenance Log for InShop vehicle
  const inShopVan = createdVehicles['VAN-202'];
  if (inShopVan) {
    const existingLog = await prisma.maintenanceLog.findFirst({
      where: { vehicle_id: inShopVan.id, status: 'Active' },
    });
    if (!existingLog) {
      await prisma.maintenanceLog.create({
        data: {
          vehicle_id: inShopVan.id,
          service_type: 'Transmission Service',
          cost: 1450.0,
          date: new Date(),
          status: 'Active',
        },
      });
    }
  }
  console.log('✓ Seeded maintenance logs.');

  console.log('TransitOps database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
