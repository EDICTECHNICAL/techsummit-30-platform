// Run this script in the browser console after setting admin cookie
// First run: document.cookie = "admin-auth=true"

const quizQuestions = [
  {
    text: "Your startup has limited funds but wants to scale quickly. What will you prioritize first?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Aggressive marketing campaigns", tokenDeltaMarketing: 4, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Secure seed funding", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: -2, tokenDeltaStrategy: 0 },
      { text: "Build a strong founding team", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: -2 },
      { text: "Create a lean strategy with minimal spend", tokenDeltaMarketing: -1, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Your team is facing conflicts during brainstorming. What's your move?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Bring in an external mentor to mediate", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Organize a team outing", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 3, tokenDeltaStrategy: 0 },
      { text: "Push for faster deadlines to stay focused", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: -1, tokenDeltaStrategy: 3 },
      { text: "Invest in a collaboration tool", tokenDeltaMarketing: 0, tokenDeltaCapital: 3, tokenDeltaTeam: 0, tokenDeltaStrategy: 1 }
    ]
  },
  {
    text: "A competitor launches a product similar to yours. How do you respond?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Double your marketing efforts", tokenDeltaMarketing: 4, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Cut costs and strengthen finances", tokenDeltaMarketing: -1, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Innovate with new features", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 },
      { text: "Motivate team with stock options", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 3, tokenDeltaStrategy: 0 }
    ]
  },
  {
    text: "You have to pitch in 90 seconds. What's your core focus?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Market size and potential", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "ROI and revenue projections", tokenDeltaMarketing: -1, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Team credibility and experience", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Unique strategy and execution plan", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: -2, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Your startup gets sudden media attention. What's your action?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Amplify it with PR campaigns", tokenDeltaMarketing: 4, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Attract investors while hype is high", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: -1, tokenDeltaStrategy: 0 },
      { text: "Keep team motivated to handle growth", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: -1 },
      { text: "Focus on scaling operations smoothly", tokenDeltaMarketing: -2, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "An investor offers funds but wants equity control. What do you do?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Accept funds to grow fast", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: -2, tokenDeltaStrategy: 0 },
      { text: "Negotiate terms", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 },
      { text: "Reject and bootstrap longer", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 3, tokenDeltaStrategy: 0 },
      { text: "Use funds primarily for marketing", tokenDeltaMarketing: 3, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 }
    ]
  },
  {
    text: "Customer feedback shows product confusion. What's your priority?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Simplify and rebrand", tokenDeltaMarketing: 4, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Allocate budget to customer support", tokenDeltaMarketing: 0, tokenDeltaCapital: 3, tokenDeltaTeam: 1, tokenDeltaStrategy: 0 },
      { text: "Strengthen team training", tokenDeltaMarketing: -1, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Redesign product roadmap", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "How will you expand into a new city?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Launch city-specific campaigns", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "Raise funds for expansion", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: -1, tokenDeltaStrategy: 0 },
      { text: "Recruit local team members", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Analyze city market strategy first", tokenDeltaMarketing: -2, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Your startup gets shortlisted for an award. What will you showcase?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Viral marketing success", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: -1, tokenDeltaStrategy: 0 },
      { text: "Impressive revenue growth", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "Strong team culture", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Long-term vision and strategy", tokenDeltaMarketing: -1, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "The product is ready but budget is tight. What's your launch style?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Social media buzz with low budget", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "Delay launch till funding arrives", tokenDeltaMarketing: -1, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Team-driven grassroots campaign", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Controlled pilot launch", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: -1, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "A big competitor approaches for collaboration. Do you…?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Co-market products together", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "Share costs & profits", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: -1, tokenDeltaStrategy: 0 },
      { text: "Create cross-team exchange", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Use it for long-term growth plan", tokenDeltaMarketing: -1, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Your app gets sudden server crashes due to traffic. What's your step?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Announce quickly on socials", tokenDeltaMarketing: 4, tokenDeltaCapital: 0, tokenDeltaTeam: -1, tokenDeltaStrategy: 0 },
      { text: "Invest in better servers", tokenDeltaMarketing: 0, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: -1 },
      { text: "Get team to work overnight", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Redesign infrastructure", tokenDeltaMarketing: 0, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "To attract customers early, what tactic do you use?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Discounts & referral campaigns", tokenDeltaMarketing: 4, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Fund loyalty rewards", tokenDeltaMarketing: 1, tokenDeltaCapital: 3, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Build a strong support team", tokenDeltaMarketing: -1, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: 0 },
      { text: "Offer unique pricing strategy", tokenDeltaMarketing: 0, tokenDeltaCapital: -1, tokenDeltaTeam: 0, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Which startup quality do you value most?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Brand recognition", tokenDeltaMarketing: 4, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Financial sustainability", tokenDeltaMarketing: -1, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Team unity", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: -2 },
      { text: "Clear roadmap", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: -1, tokenDeltaStrategy: 4 }
    ]
  },
  {
    text: "Your startup wins funding. Where do you spend first?",
    maxTokenPerQuestion: 4,
    questionOptions: [
      { text: "Aggressive digital marketing", tokenDeltaMarketing: 4, tokenDeltaCapital: -2, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Operational reserves", tokenDeltaMarketing: -1, tokenDeltaCapital: 4, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: "Team expansion", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 4, tokenDeltaStrategy: -1 },
      { text: "Strategic R&D", tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: -2, tokenDeltaStrategy: 4 }
    ]
  }
];

async function seedQuestionsInBrowser() {
  console.log('🚀 Starting to seed questions via browser...');
  
  // Set admin auth cookie
  document.cookie = "admin-auth=true";
  
  for (let i = 0; i < quizQuestions.length; i++) {
    const question = quizQuestions[i];
    console.log(`📝 Adding question ${i + 1}: ${question.text.substring(0, 60)}...`);
    
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(question)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to add question ${i + 1}:`, error);
        continue;
      }
      
      const result = await response.json();
      console.log(`✅ Question ${i + 1} added successfully`);
    } catch (error) {
      console.error(`❌ Error adding question ${i + 1}:`, error);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🎉 Finished seeding all questions!');
}

// Call the function
seedQuestionsInBrowser();