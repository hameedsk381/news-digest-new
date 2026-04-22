import asyncio
import json
import logging
from typing import Dict, Any
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

# Concurrency control to handle Groq rate limits
# Limits the number of simultaneous API calls
groq_semaphore = asyncio.Semaphore(3)

async def analyze_article_with_llm(text: str) -> Dict[str, Any]:
    """
    Uses Groq to perform classification, sentiment, NER, and summarization in one pass.
    """
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY is not set. Returning empty analysis.")
        return {}

    client = AsyncGroq(api_key=settings.groq_api_key)

    prompt = f"""
    You are an expert news analyst. Analyze the following article text.
    You are an expert Indian news analyst. Analyze the following article text from an Indian newspaper.
    The article may be in English or a regional Indian language (Hindi, Marathi, Tamil, etc.).
    Perform the following tasks:
    1. Detect the Source Language of the article.
    2. Summarize the article concisely (2-3 sentences) in ENGLISH.
    3. Classify the article into exactly ONE: Politics, Sports, Business, Technology, Entertainment, Health, Science, World, Education, Environment.
    4. Analyze sentiment and societal impact.
    5. Extract key entities in ENGLISH (canonical names).
    6. Normalize any Indian currency/numbers (Lakhs, Crores) into standard integers in the summary.
    7. Provide a 'cleaned' version of the text, removing ads and artifacts.

    Respond ONLY in valid JSON format matching this schema:
    {{
        "source_language": "English" | "Hindi" | "Marathi" | etc,
        "is_valid_article": true/false,
        "summary": "English summary here",
        "category": "...",
        "sentiment": {{ ... }},
        "entities": [ ... ],
        "cleaned_content": "...",
        "indian_context": {{ ... }}
    }}

    Article Text:
    {text[:6000]}
    """

    # Use semaphore to limit concurrency
    async with groq_semaphore:
        max_retries = 3
        base_delay = 2

        for attempt in range(max_retries):
            try:
                chat_completion = await client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama3-8b-8192",
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )
                
                response_text = chat_completion.choices[0].message.content
                return json.loads(response_text)
            except Exception as e:
                # Handle rate limits (429) specifically if possible, or generic catch
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Rate limit hit. Retrying in {delay}s (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                
                logger.error(f"Groq LLM analysis failed: {e}")
                return {}
        
        return {}
