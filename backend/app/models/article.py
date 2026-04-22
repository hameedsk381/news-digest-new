"""
Pydantic models for articles and API responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class SentimentResult(BaseModel):
    """Sentiment analysis result."""
    label: str = Field(..., description="Positive, Negative, or Neutral")
    score: float = Field(..., description="Confidence score 0-1")
    societal_impact: Optional[str] = Field(None, description="Beneficial, Harmful, or Neutral")
    reason: Optional[str] = Field(None, description="Explanation for the sentiment/impact assessment")


class EntityResult(BaseModel):
    """Named entity recognition result."""
    text: str
    label: str  # PER, ORG, LOC, MISC


class ArticleBase(BaseModel):
    """Base article fields."""
    title: str
    content: str
    summary: Optional[str] = None
    category: str
    sentiment: SentimentResult
    entities: Optional[List[EntityResult]] = []
    source_file: Optional[str] = None
    batch_id: Optional[str] = None


class ArticleCreate(ArticleBase):
    """Model for creating a new article in the database."""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ArticleResponse(ArticleBase):
    """Model for API response with MongoDB ID."""
    id: str = Field(..., alias="_id")
    created_at: datetime

    model_config = {"populate_by_name": True}


class AnalyticsResponse(BaseModel):
    """Aggregated analytics data."""
    total_articles: int
    sentiment_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    impact_distribution: Dict[str, int]
    avg_sentiment_score: float


class UploadResponse(BaseModel):
    """Response after processing an upload."""
    message: str
    articles_count: int
    articles: List[dict]
    batch_id: str


class BatchResponse(BaseModel):
    """Report for a single upload batch."""
    batch_id: str
    source_name: str
    created_at: datetime
    articles: List[ArticleResponse]
    sentiment_summary: Dict[str, int]
    category_summary: Dict[str, int]
