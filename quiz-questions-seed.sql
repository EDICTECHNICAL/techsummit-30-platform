-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    max_token_per_question INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    token_delta_marketing INTEGER NOT NULL DEFAULT 0,
    token_delta_capital INTEGER NOT NULL DEFAULT 0,
    token_delta_team INTEGER NOT NULL DEFAULT 0,
    token_delta_strategy INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Clear existing data
DELETE FROM options;
DELETE FROM questions;

-- Insert Quiz Questions
INSERT INTO questions (text, "order", max_token_per_question) VALUES 
('Your startup has limited funds but wants to scale quickly. What will you prioritize first?', 1, 4),
('Your team is facing conflicts during brainstorming. What''s your move?', 2, 4),
('A competitor launches a product similar to yours. How do you respond?', 3, 4),
('You have to pitch in 90 seconds. What''s your core focus?', 4, 4),
('Your startup gets sudden media attention. What''s your action?', 5, 4),
('An investor offers funds but wants equity control. What do you do?', 6, 4),
('Customer feedback shows product confusion. What''s your priority?', 7, 4),
('How will you expand into a new city?', 8, 4),
('Your startup gets shortlisted for an award. What will you showcase?', 9, 4),
('The product is ready but budget is tight. What''s your launch style?', 10, 4),
('A big competitor approaches for collaboration. Do you…?', 11, 4),
('Your app gets sudden server crashes due to traffic. What''s your step?', 12, 4),
('To attract customers early, what tactic do you use?', 13, 4),
('Which startup quality do you value most?', 14, 4),
('Your startup wins funding. Where do you spend first?', 15, 4);

-- Insert Options for Question 1
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(1, 'Aggressive marketing campaigns', 1, 4, -2, 0, 0),
(1, 'Secure seed funding', 2, 0, 4, -2, 0),
(1, 'Build a strong founding team', 3, 0, 0, 4, -2),
(1, 'Create a lean strategy with minimal spend', 4, -1, 0, 0, 4);

-- Insert Options for Question 2
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(2, 'Bring in an external mentor to mediate', 1, 0, -1, 4, 0),
(2, 'Organize a team outing', 2, 0, -2, 3, 0),
(2, 'Push for faster deadlines to stay focused', 3, 0, 0, -1, 3),
(2, 'Invest in a collaboration tool', 4, 0, 3, 0, 1);

-- Insert Options for Question 3
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(3, 'Double your marketing efforts', 1, 4, -2, 0, 0),
(3, 'Cut costs and strengthen finances', 2, -1, 4, 0, 0),
(3, 'Innovate with new features', 3, 0, -1, 0, 4),
(3, 'Motivate team with stock options', 4, 0, -1, 3, 0);

-- Insert Options for Question 4
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(4, 'Market size and potential', 1, 4, 0, 0, -1),
(4, 'ROI and revenue projections', 2, -1, 4, 0, 0),
(4, 'Team credibility and experience', 3, 0, -1, 4, 0),
(4, 'Unique strategy and execution plan', 4, 0, 0, -2, 4);

-- Insert Options for Question 5
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(5, 'Amplify it with PR campaigns', 1, 4, -1, 0, 0),
(5, 'Attract investors while hype is high', 2, 0, 4, -1, 0),
(5, 'Keep team motivated to handle growth', 3, 0, 0, 4, -1),
(5, 'Focus on scaling operations smoothly', 4, -2, 0, 0, 4);

-- Insert Options for Question 6
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(6, 'Accept funds to grow fast', 1, 0, 4, -2, 0),
(6, 'Negotiate terms', 2, 0, -1, 0, 4),
(6, 'Reject and bootstrap longer', 3, 0, -2, 3, 0),
(6, 'Use funds primarily for marketing', 4, 3, 0, 0, -1);

-- Insert Options for Question 7
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(7, 'Simplify and rebrand', 1, 4, -1, 0, 0),
(7, 'Allocate budget to customer support', 2, 0, 3, 1, 0),
(7, 'Strengthen team training', 3, -1, 0, 4, 0),
(7, 'Redesign product roadmap', 4, 0, -1, 0, 4);

-- Insert Options for Question 8
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(8, 'Launch city-specific campaigns', 1, 4, 0, 0, -1),
(8, 'Raise funds for expansion', 2, 0, 4, -1, 0),
(8, 'Recruit local team members', 3, 0, -1, 4, 0),
(8, 'Analyze city market strategy first', 4, -2, 0, 0, 4);

-- Insert Options for Question 9
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(9, 'Viral marketing success', 1, 4, 0, -1, 0),
(9, 'Impressive revenue growth', 2, 0, 4, 0, -1),
(9, 'Strong team culture', 3, 0, -2, 4, 0),
(9, 'Long-term vision and strategy', 4, -1, 0, 0, 4);

-- Insert Options for Question 10
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(10, 'Social media buzz with low budget', 1, 4, 0, 0, -1),
(10, 'Delay launch till funding arrives', 2, -1, 4, 0, 0),
(10, 'Team-driven grassroots campaign', 3, 0, -2, 4, 0),
(10, 'Controlled pilot launch', 4, 0, 0, -1, 4);

-- Insert Options for Question 11
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(11, 'Co-market products together', 1, 4, 0, 0, -1),
(11, 'Share costs & profits', 2, 0, 4, -1, 0),
(11, 'Create cross-team exchange', 3, 0, -2, 4, 0),
(11, 'Use it for long-term growth plan', 4, -1, 0, 0, 4);

-- Insert Options for Question 12
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(12, 'Announce quickly on socials', 1, 4, 0, -1, 0),
(12, 'Invest in better servers', 2, 0, 4, 0, -1),
(12, 'Get team to work overnight', 3, 0, -1, 4, 0),
(12, 'Redesign infrastructure', 4, 0, -2, 0, 4);

-- Insert Options for Question 13
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(13, 'Discounts & referral campaigns', 1, 4, -2, 0, 0),
(13, 'Fund loyalty rewards', 2, 1, 3, 0, 0),
(13, 'Build a strong support team', 3, -1, 0, 4, 0),
(13, 'Offer unique pricing strategy', 4, 0, -1, 0, 4);

-- Insert Options for Question 14
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(14, 'Brand recognition', 1, 4, -2, 0, 0),
(14, 'Financial sustainability', 2, -1, 4, 0, 0),
(14, 'Team unity', 3, 0, 0, 4, -2),
(14, 'Clear roadmap', 4, 0, 0, -1, 4);

-- Insert Options for Question 15
INSERT INTO options (question_id, text, "order", token_delta_marketing, token_delta_capital, token_delta_team, token_delta_strategy) VALUES 
(15, 'Aggressive digital marketing', 1, 4, -2, 0, 0),
(15, 'Operational reserves', 2, -1, 4, 0, 0),
(15, 'Team expansion', 3, 0, 0, 4, -1),
(15, 'Strategic R&D', 4, 0, 0, -2, 4);

-- Verify the data
SELECT q.id, q.text as question, 
       COUNT(o.id) as option_count,
       STRING_AGG(o.text, ' | ' ORDER BY o."order") as options
FROM questions q 
LEFT JOIN options o ON q.id = o.question_id 
GROUP BY q.id, q.text 
ORDER BY q."order";