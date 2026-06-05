-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    bio TEXT,
    profile_image VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    instructor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL, -- 'DSA', 'OOP', 'DBMS', 'OS', 'CN', 'Aptitude'
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'mcq',
    options JSONB NOT NULL, -- Array of string options: ["A", "B", "C", "D"]
    correct_answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL, -- user responses mapping: {question_id: answer}
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    career_goal VARCHAR(150) NOT NULL,
    current_skills JSONB NOT NULL,
    roadmap_data JSONB NOT NULL, -- month-wise structure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subjects JSONB NOT NULL, -- list of subjects to cover
    available_hours INTEGER NOT NULL,
    exam_dates JSONB NOT NULL, -- date mappings
    schedule_data JSONB NOT NULL, -- calendar allocation grid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career Recommendations Table
CREATE TABLE IF NOT EXISTS career_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommended_career VARCHAR(150) NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,
    required_skills JSONB NOT NULL,
    salary_insights JSONB NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user' or 'bot'
    message TEXT NOT NULL,
    subject VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Documents Table
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    summary TEXT,
    flashcards JSONB, -- list of generated flashcards
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System/User Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    study_time_minutes INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    consistency_score INTEGER DEFAULT 0, -- streaks, active days
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, date);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
