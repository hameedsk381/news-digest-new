"""
MongoDB async connection using Motor.
Managed via FastAPI lifespan for clean startup/shutdown.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


class Database:
    """Singleton MongoDB connection manager."""

    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        """Establish connection to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[settings.db_name]

            # Verify connection works before assuming success
            await self.client.admin.command('ping')

            # Create indexes for efficient querying
            articles = self.db["articles"]
            await articles.create_index("category")
            await articles.create_index("sentiment.label")
            await articles.create_index("created_at")
            await articles.create_index(
                [("title", "text"), ("content", "text")],
                name="text_search_index",
            )
            print(f"[OK] Connected to MongoDB: {settings.db_name}")
        except Exception as e:
            print(f"[ERROR] Failed to connect to MongoDB at {settings.mongo_uri}: {e}")
            print("[WARN] The API will run, but upload/retrieve operations will fail until MongoDB is started.")

    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            print("[OK] Disconnected from MongoDB")


# Global instance
database = Database()


async def get_db():
    """FastAPI dependency to get database instance."""
    return database.db
