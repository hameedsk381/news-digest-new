"""
Semantic Stitching Service.
Connects fragmented articles across multiple pages using LLM verification.
"""

import logging
import json
from typing import List, Dict, Any
from app.services.llm import analyze_article_with_llm
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

async def verify_stitching(lead_content: str, tail_content: str) -> bool:
    """
    Uses Groq to verify if the tail_content is a logical continuation of lead_content.
    """
    if not settings.groq_api_key:
        return False
        
    client = AsyncGroq(api_key=settings.groq_api_key)
    
    # Take the end of lead and start of tail for comparison to save tokens
    lead_sample = lead_content[-1000:]
    tail_sample = tail_content[:1000]
    
    prompt = f"""
    You are a professional editor. Determine if 'Segment B' is a direct logical and grammatical continuation of 'Segment A'.
    This happens when an article is split across multiple columns or pages in a newspaper.
    
    Segment A (End of first part):
    ...{lead_sample}
    
    Segment B (Start of potential second part):
    {tail_sample}...
    
    Respond ONLY in JSON:
    {{
        "is_continuation": true/false,
        "reason": "short explanation"
    }}
    """
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        result = json.loads(chat_completion.choices[0].message.content)
        return result.get("is_continuation", False)
    except Exception as e:
        logger.error(f"Stitching verification failed: {e}")
        return False

async def stitch_articles(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Scans segments for 'leads' and 'orphans' and attempts to stitch them.
    """
    if len(segments) < 2:
        return segments
        
    stitched = []
    skip_indices = set()
    
    for i in range(len(segments)):
        if i in skip_indices:
            continue
            
        current = segments[i]
        
        # If this is a lead, look for a tail
        if current.get("is_lead"):
            found_tail = False
            # Search subsequent segments for an orphan that matches
            for j in range(i + 1, len(segments)):
                if j in skip_indices:
                    continue
                    
                candidate = segments[j]
                # Orphans or segments with "CONTINUED" in title are candidates
                is_candidate = candidate.get("is_orphan") or "CONT" in candidate.get("title", "").upper()
                
                if is_candidate:
                    logger.info(f"Attempting to stitch lead '{current['title']}' with candidate '{candidate['title']}'")
                    if await verify_stitching(current["content"], candidate["content"]):
                        logger.info(f"✅ Successful stitch: '{current['title']}' + '{candidate['title']}'")
                        current["content"] = current["content"] + "\n\n" + candidate["content"]
                        current["is_lead"] = candidate.get("is_lead", False) # Might continue again!
                        skip_indices.add(j)
                        found_tail = True
                        # If the tail is ALSO a lead, we keep looking (recursive-like)
                        if not current["is_lead"]:
                            break
            
        stitched.append(current)
        
    return stitched
