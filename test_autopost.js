const fs = require('fs');

async function testAutoPost() {
  console.log("0. Injecting mock OAuth tokens for testing...");
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      linkedinAccessToken: "mock_token",
      twitterAccessToken: "mock_token",
      facebookAccessToken: "mock_token",
      youtubeAccessToken: "mock_token",
      instagramAccessToken: "mock_token"
    },
    create: {
      id: "default",
      linkedinAccessToken: "mock_token",
      twitterAccessToken: "mock_token",
      facebookAccessToken: "mock_token",
      youtubeAccessToken: "mock_token",
      instagramAccessToken: "mock_token"
    }
  });
  
  console.log("\n2. Creating a test past-due social post with a video attached...");
  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - 10);
  
  const res = await fetch('http://127.0.0.1:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "Post: Volts Automation Video",
      start: pastDate.toISOString(),
      type: "social",
      platform: "linkedin",    // Send explicitly as top-level fields
      content: "Auto-publishing video test #2",
      videoUrl: "/uploads/videos/test-video.mp4",
      color: "#3b82f6"
    })
  });
  
  const createdEvent = await res.json();
  console.log("Created event:", createdEvent.id, "Status:", createdEvent.status);

  console.log("\n3. Triggering the Auto-Post API...");
  const autoRes = await fetch('http://127.0.0.1:3000/api/auto-post', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer volts-dev-secret' }
  });
  
  const autoPostResult = await autoRes.json();
  console.log("Auto-Post Result:", JSON.stringify(autoPostResult, null, 2));
}

testAutoPost();
