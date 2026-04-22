"""
Upload route — handles file and URL ingestion.
Orchestrates the full processing pipeline.
"""

import logging
from datetime import datetime
from typing import Optional
import hashlib

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from app.database import get_db
import asyncio
import hashlib
import uuid
import re
from app.services.extraction import extract_from_pdf, extract_from_url
from app.services.segmentation import segment_with_fallback
from app.services.stitching import stitch_articles
from app.services.llm import analyze_article_with_llm

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    db=Depends(get_db),
):
    """
    Upload a newspaper file (PDF/image) or URL for processing.

    The full pipeline:
    1. Extract text from input
    2. Segment into individual articles
    3. For each article: classify, analyze sentiment, extract entities
    4. Store results in MongoDB
    """
    if not file and not url:
        raise HTTPException(status_code=400, detail="Please provide a file or URL")

    # Step 1: Extract text and layout
    extraction_result = None
    source_name = ""

    try:
        if file:
            file_bytes = await file.read()
            source_name = file.filename or "uploaded_file"
            content_type = file.content_type or ""

            if "pdf" in content_type or source_name.lower().endswith(".pdf"):
                logger.info("Processing PDF: %s", source_name)
                extraction_result = await extract_from_pdf(file_bytes)
            elif any(ext in content_type for ext in ["image", "png", "jpeg", "jpg", "tiff", "bmp"]) or \
                 source_name.lower().endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp")):
                logger.info("Processing image: %s", source_name)
                extraction_result = await extract_from_image(file_bytes)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {content_type}. Use PDF or image files.",
                )
        elif url:
            logger.info("Processing URL: %s", url)
            source_name = url
            # URLs return raw text for now (fallback handled in segmentation)
            text = await extract_from_url(url)
            extraction_result = {"text": text, "source_type": "url"}
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Extraction failed: {str(e)}"
        )

    if not extraction_result:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any content from the input.",
        )

    # Step 2: Segment into articles (Layout-Aware)
    logger.info("Segmenting content...")
    article_segments = segment_with_fallback(extraction_result)

    if not article_segments:
        raise HTTPException(status_code=422, detail="No articles could be segmented from the input.")

    # Step 2.5: Semantic Stitching (Merge page jumps)
    logger.info("Applying semantic stitching...")
    article_segments = await stitch_articles(article_segments)

    # Create Batch Entry
    batch_id = str(uuid.uuid4())
    batch_timestamp = datetime.utcnow()
    
    await db["batches"].insert_one({
        "batch_id": batch_id,
        "source_name": source_name,
        "created_at": batch_timestamp,
        "total_count": len(article_segments),
        "processed_count": 0,
        "status": "processing"
    })

    # Step 3: Queue the ML processing in the background
    background_tasks.add_task(
        process_articles_task, 
        batch_id, 
        article_segments, 
        source_name, 
        db
    )

    return {
        "message": "Upload successful. Processing in background.",
        "batch_id": batch_id,
        "total_articles": len(article_segments),
        "status": "processing"
    }


async def process_articles_task(batch_id: str, article_segments: list, source_name: str, db):
    """
    Background task to process articles through the LLM pipeline.
    Updates the batch status and article collection as it progresses.
    """
    articles_collection = db["articles"]
    batches_collection = db["batches"]
    processed_count = 0

    for i, article in enumerate(article_segments):
        title = article.get("title", "Untitled")
        content = article.get("content", "")
        is_noise_heuristic = article.get("is_noise", False)
        
        # Heuristic skip: If it's short and looks like an ad, skip LLM entirely
        if is_noise_heuristic and len(content) < 300:
            logger.info("Skipping suspected noise segment: %s", title[:40])
            continue

        try:
            # 1. Check for existing analysis (Content Hashing)
            content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
            existing_article = await articles_collection.find_one({"content_hash": content_hash})
            
            if existing_article:
                analysis_results = {
                    "category": existing_article["category"],
                    "sentiment": existing_article["sentiment"],
                    "entities": existing_article["entities"],
                    "summary": existing_article["summary"],
                    "cleaned_content": existing_article.get("content")
                }
            else:
                # 2. Unified LLM pass via Groq
                analysis = await analyze_article_with_llm(content)
                
                # If LLM says it's not a valid article, drop it
                if not analysis.get("is_valid_article", True):
                    logger.info("LLM rejected noise segment: %s", title[:40])
                    continue

                analysis_results = {
                    "source_language": analysis.get("source_language", "English"),
                    "category": analysis.get("category", "General"),
                    "sentiment": analysis.get("sentiment", {"label": "Neutral", "score": 0.5, "societal_impact": "Neutral", "reason": "Not analyzed"}),
                    "entities": analysis.get("entities", []),
                    "summary": analysis.get("summary", ""),
                    "cleaned_content": analysis.get("cleaned_content"),
                    "indian_context": analysis.get("indian_context", {})
                }
            
            # Use cleaned content if available
            final_content = analysis_results.get("cleaned_content") or content
            
            # 3. Entity Resolution logic
            resolved_entities = []
            for ent in analysis_results.get("entities", []):
                canonical = ent.get("canonical", ent.get("text", "Unknown"))
                label = ent.get("label", "MISC")
                
                # Generate a slug-based ID for cross-article matching
                entity_slug = re.sub(r'[^a-z0-9]+', '-', canonical.lower()).strip('-')
                
                if entity_slug:
                    # Upsert into entities collection
                    await db["entities"].update_one(
                        {"entity_id": entity_slug},
                        {
                            "$set": {
                                "name": canonical,
                                "label": label,
                                "last_seen": datetime.utcnow()
                            },
                            "$inc": {"mention_count": 1}
                        },
                        upsert=True
                    )
                    
                    resolved_entities.append({
                        "text": ent.get("text"),
                        "canonical": canonical,
                        "label": label,
                        "entity_id": entity_slug
                    })

            # Build article document
            article_doc = {
                "title": title,
                "content": final_content,
                "summary": analysis_results["summary"],
                "category": analysis_results["category"],
                "sentiment": analysis_results["sentiment"],
                "entities": resolved_entities,
                "indian_context": analysis_results["indian_context"],
                "source_language": analysis_results["source_language"],
                "source_file": source_name,
                "batch_id": batch_id,
                "content_hash": content_hash,
                "created_at": datetime.utcnow(),
            }

            # Store in MongoDB
            await articles_collection.insert_one(article_doc)
            
            # Update progress
            processed_count += 1
            await batches_collection.update_one(
                {"batch_id": batch_id},
                {"$set": {"processed_count": processed_count}}
            )

        except Exception as e:
            logger.error("Failed to process article '%s' in batch %s: %s", title[:40], batch_id, e)
            continue

    # Mark batch as complete
    await batches_collection.update_one(
        {"batch_id": batch_id},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )
    logger.info("✅ Batch %s processing complete. %d/%d articles processed.", 
                batch_id, processed_count, len(article_segments))
