const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setKey() {
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { togetherApiKey: 'tgp_v1_M7oOSzS41e0V_fC5ZqDVyZUyDIHz0kmfH1pgIJXiWd8' }
    });
    console.log('Updated existing settings with new key.');
  } else {
    await prisma.settings.create({
      data: { togetherApiKey: 'tgp_v1_M7oOSzS41e0V_fC5ZqDVyZUyDIHz0kmfH1pgIJXiWd8' }
    });
    console.log('Created new settings with new key.');
  }
}

setKey()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
