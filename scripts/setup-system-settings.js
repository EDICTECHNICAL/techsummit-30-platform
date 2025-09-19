// Run this script in the browser console to set up system settings table
// First run: document.cookie = "admin-auth=true"

async function setupSystemSettings() {
  console.log('🚀 Setting up system settings...');
  
  // Set admin auth cookie
  document.cookie = "admin-auth=true";
  
  try {
    // First, check if we can access the system settings API (it will fail if table doesn't exist)
    const testResponse = await fetch('/api/admin/system-settings');
    
    if (testResponse.ok) {
      console.log('✅ System settings table already exists');
      const settings = await testResponse.json();
      console.log('Current settings:', settings);
    } else {
      console.log('❌ System settings table needs to be created');
      console.log('Please ask the developer to run the database migration');
    }
  } catch (error) {
    console.error('❌ Error checking system settings:', error);
  }
}

// Call the function
setupSystemSettings();