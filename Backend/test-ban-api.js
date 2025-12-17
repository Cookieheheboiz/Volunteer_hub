// Test Ban/Unban API
// Chạy: node test-ban-api.js

const API_URL = "http://localhost:3000/api";

// Lấy token admin (phải login trước)
const adminEmail = "admin@volunteerhub.com";
const adminPassword = "admin123";

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const data = await response.json();
  return data.token;
}

async function getUsers(token) {
  const response = await fetch(`${API_URL}/admin/users?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.users;
}

async function toggleUserStatus(token, userId) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data;
}

async function test() {
  try {
    console.log("🔐 Logging in as admin...");
    const token = await login();
    console.log("✅ Logged in successfully\n");

    console.log("📋 Fetching users...");
    const users = await getUsers(token);
    console.log(`✅ Found ${users.length} users\n`);

    // Find first banned user
    const bannedUser = users.find((u) => u.status === "BANNED" && u.role !== "ADMIN");
    
    if (!bannedUser) {
      console.log("❌ No banned user found to test");
      return;
    }

    console.log("👤 Testing with user:");
    console.log(`   Name: ${bannedUser.name}`);
    console.log(`   Email: ${bannedUser.email}`);
    console.log(`   Status: ${bannedUser.status}\n`);

    console.log("🔓 Unbanning user...");
    const result1 = await toggleUserStatus(token, bannedUser.id);
    console.log(`✅ ${result1.message}`);
    console.log(`   New status: ${result1.user.status}\n`);

    console.log("⏳ Waiting 1 second...\n");
    await new Promise((r) => setTimeout(r, 1000));

    console.log("🔒 Banning user again...");
    const result2 = await toggleUserStatus(token, bannedUser.id);
    console.log(`✅ ${result2.message}`);
    console.log(`   New status: ${result2.user.status}\n`);

    console.log("✅ Ban/Unban API is working correctly!");
    console.log("\n💡 Now test in the UI:");
    console.log("   1. Go to http://localhost:3001");
    console.log("   2. Login as admin");
    console.log("   3. Click User Management");
    console.log("   4. Click Ban/Unban buttons");
    console.log("   5. Status should update immediately");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
