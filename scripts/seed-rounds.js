// Run this script in the browser console to create initial rounds
// First run: document.cookie = "admin-auth=true"

const rounds = [
  {
    name: 'QUIZ',
    day: 1,
    description: 'Quiz Round - Teams answer startup scenario questions to earn tokens'
  },
  {
    name: 'VOTING', 
    day: 2,
    description: 'Voting Round - Teams pitch and vote using earned tokens'
  },
  {
    name: 'FINAL',
    day: 3, 
    description: 'Final Round - Peer ratings and judge scoring'
  }
];

async function seedRoundsInBrowser() {
  console.log('🚀 Starting to seed rounds via browser...');
  
  // Set admin auth cookie
  document.cookie = "admin-auth=true";
  
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    console.log(`📝 Creating round: ${round.name} (Day ${round.day})`);
    
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(round)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to create round ${round.name}:`, error);
        continue;
      }
      
      const result = await response.json();
      console.log(`✅ Round ${round.name} created successfully:`, result);
    } catch (error) {
      console.error(`❌ Error creating round ${round.name}:`, error);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🎉 Finished seeding all rounds!');
  console.log('🔄 Refreshing page to see rounds in admin panel...');
  window.location.reload();
}

// Call the function
seedRoundsInBrowser();