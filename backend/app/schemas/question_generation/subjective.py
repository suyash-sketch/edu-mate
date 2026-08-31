from typing import List, Optional
from pydantic import BaseModel

class SingleSubjectiveQuestion(BaseModel):
    question_no: str
    bloom_level: str
    question: str
    model_answer: str
    explanation: Optional[str] = None

class SubjectiveOutput(BaseModel):
    subjective_questions: List[SingleSubjectiveQuestion]