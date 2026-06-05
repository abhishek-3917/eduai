-- Insert Roles
INSERT INTO roles (id, name) VALUES 
(1, 'student'),
(2, 'teacher'),
(3, 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert a default course
INSERT INTO courses (id, title, description, created_at, updated_at) VALUES
(1, 'Introduction to Computer Science & Development', 'Learn essential concepts of DSA, OOP, OS, and Networks.', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert DSA Assessment
INSERT INTO assessments (id, title, description, subject, course_id, created_at) VALUES
(1, 'DSA Fundamentals Evaluation', 'Assess your knowledge on core structures and time complexites.', 'DSA', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Questions for DSA
INSERT INTO questions (assessment_id, question_text, type, options, correct_answer) VALUES
(1, 'What is the worst-case time complexity of searching in a Hash Table?', 'mcq', '["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(n log n)"]', 'C) O(n)'),
(1, 'Which data structure follows the Last In First Out (LIFO) principle?', 'mcq', '["A) Queue", "B) Stack", "C) Linked List", "D) Binary Tree"]', 'B) Stack'),
(1, 'What is the time complexity of Quick Sort in the worst case?', 'mcq', '["A) O(n log n)", "B) O(n^2)", "C) O(n)", "D) O(2^n)"]', 'B) O(n^2)')
ON CONFLICT DO NOTHING;

-- Insert DBMS Assessment
INSERT INTO assessments (id, title, description, subject, course_id, created_at) VALUES
(2, 'DBMS Architecture and SQL Assessment', 'Evaluate database concepts, normal forms, and transaction ACID properties.', 'DBMS', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Questions for DBMS
INSERT INTO questions (assessment_id, question_text, type, options, correct_answer) VALUES
(2, 'Which normal form eliminates partial dependency?', 'mcq', '["A) 1NF", "B) 2NF", "C) 3NF", "D) BCNF"]', 'B) 2NF'),
(2, 'What does the "I" stand for in ACID properties of transactions?', 'mcq', '["A) Integrity", "B) Isolation", "C) Inheritance", "D) Indexing"]', 'B) Isolation')
ON CONFLICT DO NOTHING;
