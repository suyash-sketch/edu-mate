from app.schemas.question_generation.mcq import MCQOutput
from app.services.prompts import build_mcq_prompt
from app.services.question_generator import generate_structured_response, retrieve_context

def search_and_ask(user_query, collection_name: str, blooms_requirements: str = "5 remember, 3 understand, 4 apply, 3 analyze, 2 evaluate, 3 create", top_k = 5):
    context = retrieve_context(
        user_query = user_query,
        collection_name = collection_name,
        top_k = top_k
    )

    if context is None:
        return None

    system_prompt = build_mcq_prompt(
        context = context,
        blooms_requirements = blooms_requirements
    )

    return generate_structured_response(
        user_query = user_query,
        system_prompt = system_prompt,
        response_schema = MCQOutput
    )