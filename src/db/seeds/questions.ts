import { db } from '@/db';
import { questions, options } from '@/db/schema';

async function main() {
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const sampleQuestions = [
        {
            text: 'Your startup needs to validate a new product idea with minimal resources. What approach do you take?',
            order: 1,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Launch a comprehensive market research survey targeting 1000 potential customers',
                    order: 1,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Build an MVP and test with 50 early adopters from your network',
                    order: 2,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Hire a professional market research firm for detailed analysis',
                    order: 3,
                    tokenDeltaMarketing: 4,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Conduct free online research and competitor analysis only',
                    order: 4,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 1,
                    createdAt
                }
            ]
        },
        {
            text: 'You have limited resources for product development. How do you prioritize features?',
            order: 2,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Focus on building premium features that justify higher pricing',
                    order: 1,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Develop only core features that solve the main customer problem',
                    order: 2,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Build a wide range of features to attract different customer segments',
                    order: 3,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: -1,
                    totalScoreDelta: 2,
                    createdAt
                },
                {
                    text: 'Outsource development to build features faster and cheaper',
                    order: 4,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: -2,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 2,
                    createdAt
                }
            ]
        },
        {
            text: 'Your startup needs funding to scale. Which funding route do you choose?',
            order: 3,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Bootstrap through customer revenue and reinvest profits',
                    order: 1,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 4,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Seek angel investors for seed funding',
                    order: 2,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Apply to a prestigious accelerator program',
                    order: 3,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Crowdfund through Kickstarter to validate demand',
                    order: 4,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: -2,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'You need to build a strong team for your startup. What hiring strategy do you follow?',
            order: 4,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Hire experienced professionals with proven track records at market rates',
                    order: 1,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 4,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Recruit talented but inexperienced people willing to work for equity',
                    order: 2,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Hire remote contractors from different countries to save costs',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Partner with co-founders and avoid hiring initially',
                    order: 4,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'Your customer acquisition cost is too high. How do you improve marketing efficiency?',
            order: 5,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Invest heavily in content marketing and SEO for organic growth',
                    order: 1,
                    tokenDeltaMarketing: 4,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Implement a referral program to leverage existing customers',
                    order: 2,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Partner with influencers and pay commission only on sales',
                    order: 3,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Focus on cold outreach and direct sales',
                    order: 4,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 2,
                    createdAt
                }
            ]
        },
        {
            text: 'You need to choose a technology platform for rapid scaling. What approach do you take?',
            order: 6,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Use proven enterprise solutions like AWS and Salesforce despite higher costs',
                    order: 1,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Build custom solutions for maximum control and flexibility',
                    order: 2,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Use open-source tools to minimize costs',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Partner with a tech company for infrastructure support',
                    order: 4,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 4,
                    createdAt
                }
            ]
        },
        {
            text: 'Your startup faces major competition from established players. How do you compete?',
            order: 7,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Focus on a niche market segment they are ignoring',
                    order: 1,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 4,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Differentiate through superior customer service and experience',
                    order: 2,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Compete on price by operating more efficiently',
                    order: 3,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Quickly add features that competitors lack',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'You have the opportunity to expand internationally. How do you approach this growth?',
            order: 8,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Partner with local companies who understand the market',
                    order: 1,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 4,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Hire local teams in each target market',
                    order: 2,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 4,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Expand gradually from your home base',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Acquire local competitors to quickly gain market presence',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'Your startup faces significant financial risk. How do you manage this uncertainty?',
            order: 9,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Maintain large cash reserves to weather any storm',
                    order: 1,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 4,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Diversify revenue streams across multiple products',
                    order: 2,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Purchase insurance to cover major business risks',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Avoid risk by focusing only on proven markets',
                    order: 4,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 2,
                    createdAt
                }
            ]
        },
        {
            text: 'You have the chance to form a strategic partnership. How do you evaluate this opportunity?',
            order: 10,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Partner only if they provide access to new customer segments',
                    order: 1,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Form partnerships that strengthen your core value proposition',
                    order: 2,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Avoid partnerships to maintain full control and flexibility',
                    order: 3,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 2,
                    createdAt
                },
                {
                    text: 'Partner with multiple companies to maximize opportunities',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'Your team has conflicting opinions about product direction. How do you handle this disagreement?',
            order: 11,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Make the final decision yourself as CEO and move forward quickly',
                    order: 1,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: -2,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 2,
                    createdAt
                },
                {
                    text: 'Facilitate discussion until everyone reaches consensus',
                    order: 2,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Use data and customer feedback to resolve the dispute',
                    order: 3,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Test both approaches with small customer groups',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 4,
                    createdAt
                }
            ]
        },
        {
            text: 'You discover a major flaw in your business model. How do you pivot?',
            order: 12,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Make incremental changes while keeping core business intact',
                    order: 1,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Completely overhaul the model despite current momentum',
                    order: 2,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 4,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Run parallel business models to test the new approach',
                    order: 3,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Collect more data before making any major changes',
                    order: 4,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 1,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 2,
                    createdAt
                }
            ]
        },
        {
            text: 'Your competitors are copying your innovative features. How do you respond?',
            order: 13,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Accelerate innovation to stay ahead of competitors',
                    order: 1,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Focus on building strong customer relationships and loyalty',
                    order: 2,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Protect your innovations through patents and legal means',
                    order: 3,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: -1,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 2,
                    createdAt
                },
                {
                    text: 'Differentiate through superior execution and service quality',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: 0,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        },
        {
            text: 'You need to reduce operational costs while maintaining growth. What approach do you take?',
            order: 14,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Automate processes through technology investments',
                    order: 1,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 2,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Outsource non-core functions to specialized providers',
                    order: 2,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                },
                {
                    text: 'Negotiate better terms with suppliers and vendors',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Reduce team size and redistribute workload',
                    order: 4,
                    tokenDeltaMarketing: -1,
                    tokenDeltaCapital: 3,
                    tokenDeltaTeam: -3,
                    tokenDeltaStrategy: 0,
                    totalScoreDelta: 1,
                    createdAt
                }
            ]
        },
        {
            text: 'You have the opportunity to acquire a competitor. How do you evaluate this decision?',
            order: 15,
            createdAt,
            updatedAt,
            options: [
                {
                    text: 'Acquire if it provides access to new technology or talent',
                    order: 1,
                    tokenDeltaMarketing: 1,
                    tokenDeltaCapital: -3,
                    tokenDeltaTeam: 3,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Acquire only if it eliminates major competition and increases market share',
                    order: 2,
                    tokenDeltaMarketing: 3,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 3,
                    totalScoreDelta: 4,
                    createdAt
                },
                {
                    text: 'Avoid acquisitions and focus on organic growth',
                    order: 3,
                    tokenDeltaMarketing: 0,
                    tokenDeltaCapital: 2,
                    tokenDeltaTeam: 0,
                    tokenDeltaStrategy: 1,
                    totalScoreDelta: 2,
                    createdAt
                },
                {
                    text: 'Acquire smaller companies for their customer base',
                    order: 4,
                    tokenDeltaMarketing: 2,
                    tokenDeltaCapital: -2,
                    tokenDeltaTeam: -1,
                    tokenDeltaStrategy: 2,
                    totalScoreDelta: 3,
                    createdAt
                }
            ]
        }
    ];

    for (const question of sampleQuestions) {
        const { options: questionOptions, ...questionData } = question;
        const [insertedQuestion] = await db.insert(questions).values(questionData).returning();
        
        const optionsWithQuestionId = questionOptions.map(option => ({
            ...option,
            questionId: insertedQuestion.id
        }));
        
        await db.insert(options).values(optionsWithQuestionId);
    }

    console.log('✅ Questions and options seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});