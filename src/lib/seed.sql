-- SEEDING IPL 2026 MATCHES
INSERT INTO public.matches (sport, tournament, team_a, team_b, team_a_logo, team_b_logo, match_time, ai_prediction)
VALUES 
('cricket', 'IPL 2026', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'CSK', 'RCB', '2026-03-27 19:30:00+00', '{"winner": "team_a", "confidence": 72, "reasoning": "CSK has a dominant 78% win record at Chepauk in night matches."}'),
('cricket', 'IPL 2026', 'Mumbai Indians', 'Gujarat Titans', 'MI', 'GT', '2026-03-28 15:30:00+00', '{"winner": "team_b", "confidence": 61, "reasoning": "GT''s bowling attack is better suited for the Ahmedabad breeze."}'),
('cricket', 'IPL 2026', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'KKR', 'SRH', '2026-03-28 19:30:00+00', '{"winner": "team_a", "confidence": 55, "reasoning": "Eden Gardens spin-friendly pitch favors KKR''s current roster."}'),
('cricket', 'IPL 2026', 'Delhi Capitals', 'Punjab Kings', 'DC', 'PBKS', '2026-03-29 19:30:00+00', '{"winner": "team_a", "confidence": 68, "reasoning": "DC''s top order has historically outperformed PBKS in season openers."}'),
('cricket', 'IPL 2026', 'Rajasthan Royals', 'Lucknow Super Giants', 'RR', 'LSG', '2026-03-30 19:30:00+00', '{"winner": "team_a", "confidence": 59, "reasoning": "RR''s core stability gives them a slight edge over the revamped LSG lineup."}');
