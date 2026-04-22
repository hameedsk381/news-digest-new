"""
Articles routes — CRUD operations, search, filtering, analytics, and export.
"""

import csv
import io
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId

from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/articles")
async def get_articles(
    category: Optional[str] = Query(None, description="Filter by category"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment label"),
    search: Optional[str] = Query(None, description="Keyword search"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db=Depends(get_db),
):
    """
    Get articles with optional filtering, search, and pagination.
    """
    query = {}

    if category:
        query["category"] = {"$regex": category, "$options": "i"}

    if sentiment:
        query["sentiment.label"] = {"$regex": sentiment, "$options": "i"}

    if search:
        query["$text"] = {"$search": search}

    articles_collection = db["articles"]

    cursor = articles_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    articles = await cursor.to_list(length=limit)

    # Get total count for pagination
    total = await articles_collection.count_documents(query)

    # Serialize ObjectIds
    for article in articles:
        article["_id"] = str(article["_id"])
        if "created_at" in article:
            article["created_at"] = article["created_at"].isoformat()

    return {
        "articles": articles,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/articles/{article_id}")
async def get_article(article_id: str, db=Depends(get_db)):
    """Get a single article by ID."""
    try:
        oid = ObjectId(article_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    article = await db["articles"].find_one({"_id": oid})

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article["_id"] = str(article["_id"])
    if "created_at" in article:
        article["created_at"] = article["created_at"].isoformat()

    return article


@router.delete("/articles/{article_id}")
async def delete_article(article_id: str, db=Depends(get_db)):
    """Delete an article by ID."""
    try:
        oid = ObjectId(article_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    result = await db["articles"].delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    return {"message": "Article deleted successfully"}


@router.get("/analytics")
async def get_analytics(db=Depends(get_db)):
    """
    Get aggregated analytics:
    - Sentiment distribution
    - Category distribution
    - Total article count
    - Average sentiment score
    """
    articles_collection = db["articles"]

    # Total count
    total = await articles_collection.count_documents({})

    if total == 0:
        return {
            "total_articles": 0,
            "sentiment_distribution": {},
            "category_distribution": {},
            "impact_distribution": {},
            "avg_sentiment_score": 0.0,
        }

    # Sentiment distribution
    sentiment_pipeline = [
        {"$group": {"_id": "$sentiment.label", "count": {"$sum": 1}}},
    ]
    sentiment_cursor = articles_collection.aggregate(sentiment_pipeline)
    sentiment_dist = {}
    async for doc in sentiment_cursor:
        sentiment_dist[doc["_id"]] = doc["count"]

    # Category distribution
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    category_cursor = articles_collection.aggregate(category_pipeline)
    category_dist = {}
    async for doc in category_cursor:
        category_dist[doc["_id"]] = doc["count"]

    # Societal impact distribution
    impact_pipeline = [
        {"$group": {"_id": "$sentiment.societal_impact", "count": {"$sum": 1}}},
    ]
    impact_cursor = articles_collection.aggregate(impact_pipeline)
    impact_dist = {}
    async for doc in impact_cursor:
        if doc["_id"]:  # Skip None values
            impact_dist[doc["_id"]] = doc["count"]

    # Average sentiment score
    avg_pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$sentiment.score"}}},
    ]
    avg_cursor = articles_collection.aggregate(avg_pipeline)
    avg_score = 0.0
    async for doc in avg_cursor:
        avg_score = round(doc["avg_score"], 4)

    # Indian Context Aggregations
    honorifics_pipeline = [
        {"$unwind": "$indian_context.honorifics_detected"},
        {"$group": {"_id": "$indian_context.honorifics_detected", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    honorifics_cursor = articles_collection.aggregate(honorifics_pipeline)
    top_honorifics = {doc["_id"]: doc["count"] async for doc in honorifics_cursor}

    admin_pipeline = [
        {"$unwind": "$indian_context.admin_levels"},
        {"$group": {"_id": "$indian_context.admin_levels", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    admin_cursor = articles_collection.aggregate(admin_pipeline)
    admin_dist = {doc["_id"]: doc["count"] async for doc in admin_cursor}

    return {
        "total_articles": total,
        "sentiment_distribution": sentiment_dist,
        "category_distribution": category_dist,
        "impact_distribution": impact_dist,
        "avg_sentiment_score": avg_score,
        "indian_context": {
            "top_honorifics": top_honorifics,
            "admin_level_distribution": admin_dist
        }
    }


@router.get("/categories")
async def get_categories(db=Depends(get_db)):
    """
    Get all articles grouped by category.
    Returns:
        {
            "total_articles": 10,
            "categories": {
                "Politics": { "count": 3, "articles": [...] },
                ...
            }
        }
    """
    articles_collection = db["articles"]
    cursor = articles_collection.find({}).sort("created_at", -1)
    
    total_articles = 0
    categories = {}
    
    async for article in cursor:
        article["_id"] = str(article["_id"])
        if "created_at" in article:
            article["created_at"] = article["created_at"].isoformat()
            
        cat = article.get("category", "Uncategorized")
        
        if cat not in categories:
            categories[cat] = {"count": 0, "articles": []}
            
        categories[cat]["count"] += 1
        categories[cat]["articles"].append(article)
        total_articles += 1

    return {
        "total_articles": total_articles,
        "categories": categories
    }


@router.get("/export")
async def export_articles(
    format: str = Query("json", description="Export format: json or csv"),
    db=Depends(get_db),
):
    """Export all articles as JSON or CSV."""
    articles_collection = db["articles"]
    cursor = articles_collection.find({}).sort("created_at", -1)
    articles = await cursor.to_list(length=10000)

    # Serialize
    for article in articles:
        article["_id"] = str(article["_id"])
        if "created_at" in article:
            article["created_at"] = article["created_at"].isoformat()

    if format.lower() == "csv":
        output = io.StringIO()
        if articles:
            fieldnames = ["_id", "title", "category", "sentiment_label", "sentiment_score", "societal_impact", "summary", "content", "created_at"]
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for article in articles:
                writer.writerow({
                    "_id": article["_id"],
                    "title": article.get("title", ""),
                    "category": article.get("category", ""),
                    "sentiment_label": article.get("sentiment", {}).get("label", ""),
                    "sentiment_score": article.get("sentiment", {}).get("score", ""),
                    "societal_impact": article.get("sentiment", {}).get("societal_impact", ""),
                    "summary": article.get("summary", ""),
                    "content": article.get("content", ""),
                    "created_at": article.get("created_at", ""),
                })

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=articles_export.csv"},
        )


@router.get("/recent-batches")
async def get_recent_batches(limit: int = 5, db=Depends(get_db)):
    """Get most recent upload batches."""
    cursor = db["batches"].find({}).sort("created_at", -1).limit(limit)
    batches = await cursor.to_list(length=limit)
    for b in batches:
        b["_id"] = str(b["_id"])
        if "created_at" in b:
            b["created_at"] = b["created_at"].isoformat()
    return batches


@router.get("/batches/{batch_id}")
async def get_batch_report(batch_id: str, db=Depends(get_db)):
    """Get all articles belonging to a specific batch with summary stats."""
    articles_collection = db["articles"]
    batches_collection = db["batches"]

    # Get batch metadata
    batch_info = await batches_collection.find_one({"batch_id": batch_id})
    if not batch_info:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Get articles
    cursor = articles_collection.find({"batch_id": batch_id}).sort("created_at", 1)
    articles = await cursor.to_list(length=100)

    # Calculate summaries
    sentiment_summary = {}
    category_summary = {}

    for a in articles:
        a["_id"] = str(a["_id"])
        if "created_at" in a:
            a["created_at"] = a["created_at"].isoformat()
        
        # Sentiment summary
        sent = a.get("sentiment", {}).get("label", "Neutral")
        sentiment_summary[sent] = sentiment_summary.get(sent, 0) + 1
        
        # Category summary
        cat = a.get("category", "General")
        category_summary[cat] = category_summary.get(cat, 0) + 1

    return {
        "batch_id": batch_id,
        "source_name": batch_info.get("source_name", "Unknown"),
        "created_at": batch_info.get("created_at").isoformat() if batch_info.get("created_at") else None,
        "status": batch_info.get("status", "completed"),
        "total_count": batch_info.get("total_count", len(articles)),
        "processed_count": batch_info.get("processed_count", len(articles)),
        "articles": articles,
        "sentiment_summary": sentiment_summary,
        "category_summary": category_summary,
    }


@router.get("/export-json")
async def export_json(db=Depends(get_db)):
    """Export all articles as JSON."""
    articles_collection = db["articles"]
    cursor = articles_collection.find({}).sort("created_at", -1)
    articles = await cursor.to_list(length=10000)
    for article in articles:
        article["_id"] = str(article["_id"])
        if "created_at" in article:
            article["created_at"] = article["created_at"].isoformat()
    return {"articles": articles, "total": len(articles)}
