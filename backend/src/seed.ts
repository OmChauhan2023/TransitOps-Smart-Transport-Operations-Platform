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
      name: 'Jaimin Koriya (Dispatcher)',
      email: 'dispatcher@transitops.com',
      password_hash,
      role: 'Dispatcher' as const,
    },
    {
      name: 'Neha Gupta (Safety Officer)',
      email: 'safety@transitops.com',
      password_hash,
      role: 'SafetyOfficer' as const,
    },
    {
      name: 'Rajesh Sharma (Financial Analyst)',
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
      name: 'Tata Prima Heavy Truck',
      reg_number: 'MH 12 AB 1234',
      type: 'Heavy Truck' as const,
      max_load: 18000,
      load_unit: 'kg' as const,
      odometer: 124500,
      acquisition_cost: 3800000,
      status: 'Available' as const,
      region: 'West',
    },
    {
      name: 'Ashok Leyland Semi',
      reg_number: 'GJ 01 DL 5678',
      type: 'Heavy Truck' as const,
      max_load: 22000,
      load_unit: 'kg' as const,
      odometer: 89000,
      acquisition_cost: 4500000,
      status: 'Available' as const,
      region: 'West',
    },
    {
      name: 'Mahindra Bolero Pickup',
      reg_number: 'DL 04 KA 9012',
      type: 'Van' as const,
      max_load: 1500,
      load_unit: 'kg' as const,
      odometer: 45200,
      acquisition_cost: 950000,
      status: 'Available' as const,
      region: 'North',
    },
    {
      name: 'Force Traveller Express',
      reg_number: 'KA 03 HQ 3456',
      type: 'Van' as const,
      max_load: 1200,
      load_unit: 'kg' as const,
      odometer: 61000,
      acquisition_cost: 1600000,
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
      name: 'Vikram Patel',
      license_number: 'LIC-9901',
      license_category: 'Heavy CDL-A',
      license_expiry: new Date('2028-06-15'),
      contact: '+91 9876543210',
      trip_completion_pct: 98.5,
      safety_score: 96.0,
      status: 'Available' as const,
    },
    {
      name: 'Suresh Nair',
      license_number: 'LIC-9902',
      license_category: 'Standard CDL-B',
      license_expiry: new Date('2027-11-20'),
      contact: '+91 9823456789',
      trip_completion_pct: 99.2,
      safety_score: 99.0,
      status: 'Available' as const,
    },
    {
      name: 'Rohan Desai',
      license_number: 'LIC-9903',
      license_category: 'Heavy CDL-A',
      license_expiry: new Date('2026-10-10'),
      contact: '+91 9912345678',
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
  const inShopVan = createdVehicles['KA 03 HQ 3456'];
  if (inShopVan) {
    const existingLog = await prisma.maintenanceLog.findFirst({
      where: { vehicle_id: inShopVan.id, status: 'Active' },
    });
    if (!existingLog) {
      await prisma.maintenanceLog.create({
        data: {
          vehicle_id: inShopVan.id,
          service_type: 'Transmission Service',
          cost: 14500.0,
          date: new Date(),
          status: 'Active',
        },
      });
    }
  }
  console.log('✓ Seeded maintenance logs.');

  // 5. Create Demo Fuel Logs
  const truck1 = createdVehicles['MH 12 AB 1234'];
  const truck2 = createdVehicles['GJ 01 DL 5678'];
  const pickup = createdVehicles['DL 04 KA 9012'];

  if (truck1 && truck2 && pickup) {
    const fuelData = [
      {
        vehicle_id: truck1.id,
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        liters: 120.0,
        fuel_cost: 11520.0,
      },
      {
        vehicle_id: truck1.id,
        date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        liters: 150.0,
        fuel_cost: 14400.0,
      },
      {
        vehicle_id: truck2.id,
        date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        liters: 180.0,
        fuel_cost: 17280.0,
      },
      {
        vehicle_id: pickup.id,
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        liters: 45.0,
        fuel_cost: 4320.0,
      },
    ];

    for (const fl of fuelData) {
      await prisma.fuelLog.create({ data: fl });
    }
    console.log('✓ Seeded demo fuel logs.');

    // 6. Create Demo Expenses
    const expenseData = [
      {
        vehicle_id: truck1.id,
        toll: 1250.0,
        other: 650.0,
        maintenance_linked: 0.0,
        total: 1900.0,
        status: 'Logged',
      },
      {
        vehicle_id: truck2.id,
        toll: 2400.0,
        other: 1100.0,
        maintenance_linked: 0.0,
        total: 3500.0,
        status: 'Logged',
      },
      {
        vehicle_id: pickup.id,
        toll: 450.0,
        other: 300.0,
        maintenance_linked: 0.0,
        total: 750.0,
        status: 'Logged',
      },
    ];

    for (const exp of expenseData) {
      await prisma.expense.create({ data: exp });
    }
    console.log('✓ Seeded demo expenses.');
  }

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
