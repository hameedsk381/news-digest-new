"""
Article segmentation service.
Uses Markdown headers to split articles from PyMuPDF4LLM output.
"""

import logging
from typing import List, Dict, Any, Tuple
import re

from app.utils.text_cleaning import clean_text

logger = logging.getLogger(__name__)


def segment_with_fallback(extraction_result: Any) -> List[Dict[str, Any]]:
    """
    Segment articles purely based on text/markdown.
    """
    text = ""
    if isinstance(extraction_result, dict):
        text = extraction_result.get("text", "")
    else:
        text = str(extraction_result)

    return segment_articles_text(text)


def segment_articles_text(text: str) -> List[Dict[str, Any]]:
    """
    Segment articles from text using Markdown headers (#) produced by PyMuPDF4LLM.
    """
    text = clean_text(text)
    lines = text.split("\n")
    
    headline_indices = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line: continue
        
        # Detect Markdown headers (PyMuPDF4LLM output)
        if line.startswith("# ") or line.startswith("## ") or line.startswith("### "):
            headline_indices.append(i)
            continue
            
        # Legacy: Heuristic detection for plain text fallbacks
        score = 0
        if line.isupper() and len(line.split()) >= 3 and len(line) > 15: score += 3
        if 3 <= len(line.split()) <= 15 and not line.endswith(","): score += 1
        if score >= 3: headline_indices.append(i)

    articles = []
    if not headline_indices:
        return [{"title": "Untitled Article", "content": text, "is_orphan": True}] if text.strip() else []

    for idx, headline_idx in enumerate(headline_indices):
        title = lines[headline_idx].strip()
        title = title.lstrip("#").strip()
        
        start = headline_idx + 1
        end = headline_indices[idx + 1] if idx + 1 < len(headline_indices) else len(lines)
        content = "\n".join(l for l in lines[start:end] if l.strip())
        
        if content and len(content) > 50:
            # Noise detection patterns (Classifieds, ads, price lists)
            noise_patterns = [
                r"\d+\s*(?:USD|GBP|EUR|Rs|INR|Lakh|Crore|price|sale)",
                r"contact\s*:\s*[\d\w]",
                r"call\s*[\d\s-]{7,}",
                r"www\.[a-z0-9]+\.[a-z]",
                r"classified\s+ads",
                r"limited\s+offer",
                r"matrimonial",
                r"tender\s+notice",
                r"obituary",
                r"vastu",
                r"astrology",
                r"horoscope"
            ]
            
            is_noise = any(re.search(p, content, re.IGNORECASE) for p in noise_patterns)
            # Higher threshold for noise if length is very small
            if len(content) < 150 and is_noise:
                continue # Drop very small noise immediately
            
            # Check for continuation markers (leads) in multiple languages
            is_lead = any(re.search(p, content[-200:], re.IGNORECASE) for p in [
                r"continued\s+on\s+page", 
                r"see\s+page", 
                r"turn\s+to\s+p\.",
                # Hindi
                r"अगले\s+पृष्ठ\s+पर", 
                r"शेष\s+पेज",
                # Marathi
                r"पुढे\s+पहा\s+पान",
                # Tamil
                r"தொடர்ச்சி\s+பக்கம்",
                # Telugu
                r"తరువాయి\s+పేజీలో",
                # Kannada
                r"ಮುಂದುವರಿದ\s+ಭಾಗ"
            ])
            
            articles.append({
                "title": title, 
                "content": content.strip(),
                "is_lead": is_lead,
                "is_orphan": False,
                "is_noise": is_noise
            })
            
    return articles
