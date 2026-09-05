from typing import List, Optional
from pydantic import BaseModel

class SingleMCQ(BaseModel):
    question_no : str
    bloom_level : str  # e.g. "remember", "understand", "apply", "analyze", "evaluate", "create"
    question : str
    answer_options : List[str]
    correct_answer : str
    explaination : Optional[str]
    
class MCQOutput(BaseModel):
    mcqs : List[SingleMCQ]