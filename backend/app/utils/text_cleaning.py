"""
Text cleaning and preprocessing utilities.
"""

import re
import unicodedata
from typing import List


def normalize_whitespace(text: str) -> str:
    """Collapse multiple whitespace characters into single spaces."""
    text = text.replace("\t", " ")
    text = re.sub(r" +", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def remove_special_characters(text: str) -> str:
    """Remove non-printable and control characters, keep basic punctuation."""
    # Normalize unicode
    text = unicodedata.normalize("NFKD", text)
    # Remove control characters but keep newlines, tabs, and standard chars
    text = re.sub(r"[^\x20-\x7E\n\r\t]", " ", text)
    return text


def clean_text(text: str) -> str:
    """Full text cleaning pipeline."""
    text = remove_special_characters(text)
    text = normalize_whitespace(text)
    return text


def split_sentences(text: str) -> List[str]:
    """
    Split text into sentences using regex patterns.
    More portable than requiring spaCy models.
    """
    # Split on period, exclamation, question mark followed by space and uppercase
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    # Filter out very short fragments
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    return sentences


def truncate_text(text: str, max_tokens: int = 512) -> str:
    """
    Truncate text to approximate token limit.
    Rough approximation: 1 token ≈ 4 characters for English.
    """
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text
    # Truncate at last complete sentence before limit
    truncated = text[:max_chars]
    last_period = truncated.rfind(".")
    if last_period > max_chars * 0.5:
        return truncated[:last_period + 1]
    return truncated


def is_noise(text: str) -> bool:
    """Check if text is likely advertisement or noise content."""
    noise_patterns = [
        r"^\d{3}[\s\-]?\d{3}[\s\-]?\d{4}$",  # Phone numbers
        r"^www\.",  # URLs
        r"^http",  # URLs
        r"advertisement",  # Ad markers
        r"sponsored\s+content",
        r"classifieds?",
        r"^\d+\s*$",  # Just numbers
        r"^page\s+\d+",  # Page numbers
    ]
    text_lower = text.lower().strip()
    if len(text_lower) < 30:
        return True
    for pattern in noise_patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False


def estimate_token_count(text: str) -> int:
    """Rough token count estimation (1 token ≈ 0.75 words)."""
    words = text.split()
    return int(len(words) / 0.75)
