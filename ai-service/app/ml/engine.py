import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.ml.dataset import CAREER_DATASET

def match_career(user_skills: list, user_interests: list) -> list:
    """
    Matches user profile to predefined careers using TF-IDF and Cosine Similarity.
    Returns sorted list of matching careers with scores and insights.
    """
    if not user_skills:
        user_skills = []
    if not user_interests:
        user_interests = []

    # Format the query string representing the user
    user_query = " ".join(user_skills) + " " + " ".join(user_interests)
    
    # Format document list (careers)
    documents = []
    for c in CAREER_DATASET:
        doc = " ".join(c["skills"]) + " " + c["description"]
        documents.append(doc)
        
    # Append user query to fit the vectorizer on the full vocabulary
    all_docs = documents + [user_query]
    
    # Calculate TF-IDF vectors
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_docs)
    
    # Separate career vectors and user vector
    career_vectors = tfidf_matrix[:-1]
    user_vector = tfidf_matrix[-1]
    
    # Compute Cosine Similarity between user query and all careers
    similarities = cosine_similarity(user_vector, career_vectors).flatten()
    
    # Format recommendations output
    recommendations = []
    for idx, score in enumerate(similarities):
        career_info = CAREER_DATASET[idx]
        
        # Determine missing skills
        missing_skills = [s for s in career_info["skills"] if s.lower() not in [us.lower() for us in user_skills]]
        
        recommendations.append({
            "career": career_info["career"],
            "description": career_info["description"],
            "similarity_score": float(score),
            "salary_insights": career_info["salary_range"],
            "growth_rate": career_info["growth_rate"],
            "required_skills": career_info["skills"],
            "missing_skills": missing_skills
        })
        
    # Sort by similarity score descending
    recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
    return recommendations
