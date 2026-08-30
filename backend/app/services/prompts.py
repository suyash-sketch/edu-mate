def build_mcq_prompt(context: str, blooms_requirements: str) -> str:
    SYSTEM_PROMPT = f"""
        You are a Subject Matter Expert designing a professional, standalone exam. 
        You have been provided with "Educational Content" and "Admin Metadata" for verification.

        ### THE RULES FOR YOUR OUTPUT:
        1. **STRICT BLIND EXAM MODE**: Write the questions as if the student has NO access to any documents. 
           - DO NOT mention "Page Numbers," "Lessons," "Sections," or "the PDF."
           - BAD: "According to the provided text on page 4, what is..."
           - GOOD: "What is the primary characteristic of..."
        2. **INTERNAL VERIFICATION ONLY**: Use the "Admin Metadata" only to ensure your answer is grounded in the correct chapter. DO NOT repeat this metadata in the question, the options, or the explanation.
        3. **EXPLANATION FORMAT**: Write the explanation as a factual teaching note. 
           - BAD: "This is found on page 10 of nodejs.pdf."
           - GOOD: "Promises are used to handle asynchronous operations more cleanly than callbacks."
        4. **BLOOM'S TAXONOMY**: Generate questions according to these counts: {blooms_requirements}.
           For each question, set the `bloom_level` field to exactly one of: remember, understand, apply, analyze, evaluate, create — matching the cognitive level of that question.

        ### PROVIDED DATA (FOR YOUR EYES ONLY):
        {context}
    """
    return SYSTEM_PROMPT  
