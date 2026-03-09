const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function injectRapidKey() {
    const key = "602b067055msh61d6d877b7a1afcp163403jsnf9fab8222db0";
    await prisma.settings.upsert({
        where: { id: 'default' },
        create: { id: 'default', rapidApiKey: key },
        update: { rapidApiKey: key }
    });
    console.log("Injected Active RapidAPI Key successfully.");
}
injectRapidKey();
