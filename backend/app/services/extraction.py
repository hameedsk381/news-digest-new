"""
Text extraction service.
Handles digital PDF extraction.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


async def extract_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extract high-quality Markdown text from a digital PDF.
    """
    try:
        import pymupdf4llm
        import fitz

        # Open from bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        # Get high-quality Markdown text for the whole document
        full_text = pymupdf4llm.to_markdown(doc)
        doc.close()
        
        if len(full_text.strip()) < 10:
             raise ValueError("No text extracted. Ensure the PDF is digital and not just scanned images.")

        logger.info("Extracted %d chars via PyMuPDF4LLM", len(full_text))
        return {
            "text": full_text.strip(), 
            "pages": [], # We no longer need layout data
            "source_type": "pdf",
            "format": "markdown"
        }
    except Exception as e:
        logger.error("PyMuPDF4LLM extraction failed: %s", e)
        raise Exception(f"Extraction Error: {str(e)}")


async def extract_from_url(url: str) -> str:
    """
    Extract article text from a URL using httpx + BeautifulSoup.
    """
    import httpx
    from bs4 import BeautifulSoup

    try:
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (NewsIntelligence/1.0)"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "aside", "header", "form"]):
            tag.decompose()

        article = soup.find("article") or soup.find("main") or soup.find("body")
        if article is None:
            return ""

        paragraphs = article.find_all("p")
        if paragraphs:
            text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
        else:
            text = article.get_text(separator="\n", strip=True)

        logger.info("Extracted %d chars from URL: %s", len(text), url)
        return text.strip()

    except Exception as e:
        logger.error("URL extraction failed for %s: %s", url, e)
        return ""
