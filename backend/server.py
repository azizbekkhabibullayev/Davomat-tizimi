from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import insightface
from insightface.app import FaceAnalysis
from sklearn.metrics.pairwise import cosine_similarity

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT & Password
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Initialize InsightFace
face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "user"  # user or admin

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    face_embeddings: List[List[float]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class FaceRegister(BaseModel):
    user_id: str
    face_image: str  # base64 encoded

class FaceLogin(BaseModel):
    face_image: str  # base64 encoded

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    full_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "present"  # present, absent, late
    confidence: float
    image_path: Optional[str] = None

class AttendanceMark(BaseModel):
    face_image: str  # base64 encoded

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    face_threshold: float = 0.6
    attendance_policy: str = "face_only"  # face_only, password_only, both
    late_threshold_minutes: int = 15

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def base64_to_image(base64_str: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(BytesIO(img_data))
        img = img.convert('RGB')
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

def extract_face_embedding(image: np.ndarray) -> Optional[np.ndarray]:
    """Extract face embedding using InsightFace"""
    try:
        faces = face_app.get(image)
        if len(faces) == 0:
            return None
        # Return the embedding of the largest face
        largest_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))
        return largest_face.embedding
    except Exception as e:
        logging.error(f"Face embedding extraction error: {str(e)}")
        return None

def extract_multiple_faces(image: np.ndarray) -> List[np.ndarray]:
    """Extract embeddings for all faces in image"""
    try:
        faces = face_app.get(image)
        return [face.embedding for face in faces]
    except Exception as e:
        logging.error(f"Multiple face extraction error: {str(e)}")
        return []

async def find_matching_user(embedding: np.ndarray, threshold: float = 0.6) -> Optional[Dict]:
    """Find user matching the face embedding"""
    users = await db.users.find({"face_embeddings": {"$exists": True, "$ne": []}}, {"_id": 0}).to_list(1000)
    
    best_match = None
    best_similarity = threshold
    
    for user in users:
        if not user.get('face_embeddings'):
            continue
        
        for stored_embedding in user['face_embeddings']:
            stored_emb = np.array(stored_embedding).reshape(1, -1)
            current_emb = embedding.reshape(1, -1)
            similarity = cosine_similarity(stored_emb, current_emb)[0][0]
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {**user, "confidence": float(similarity)}
    
    return best_match

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user = User(**user_data.model_dump(exclude={"password"}))
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id'], "username": user['username']})
    user_data = {k: v for k, v in user.items() if k != 'password_hash'}
    return {"access_token": token, "token_type": "bearer", "user": user_data}

@api_router.post("/auth/face-login", response_model=Token)
async def face_login(data: FaceLogin):
    image = base64_to_image(data.face_image)
    embedding = extract_face_embedding(image)
    
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    threshold = settings['face_threshold'] if settings else 0.6
    
    user_match = await find_matching_user(embedding, threshold)
    if not user_match:
        raise HTTPException(status_code=401, detail="Face not recognized")
    
    token = create_access_token({"sub": user_match['id'], "username": user_match['username']})
    user_data = {k: v for k, v in user_match.items() if k not in ['password_hash', 'confidence']}
    return {"access_token": token, "token_type": "bearer", "user": user_data}

# User Routes
@api_router.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password_hash'}

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/users/register-face")
async def register_face(data: FaceRegister, current_user: dict = Depends(get_current_user)):
    # Check permission
    if current_user['role'] != 'admin' and current_user['id'] != data.user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    image = base64_to_image(data.face_image)
    embedding = extract_face_embedding(image)
    
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    # Update user face embeddings
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    embeddings = user.get('face_embeddings', [])
    embeddings.append(embedding.tolist())
    
    await db.users.update_one({"id": data.user_id}, {"$set": {"face_embeddings": embeddings}})
    return {"message": "Face registered successfully", "total_faces": len(embeddings)}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Attendance Routes
@api_router.post("/attendance/mark")
async def mark_attendance(data: AttendanceMark):
    image = base64_to_image(data.face_image)
    embeddings = extract_multiple_faces(image)
    
    if not embeddings:
        raise HTTPException(status_code=400, detail="No faces detected in image")
    
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    threshold = settings['face_threshold'] if settings else 0.6
    
    marked_users = []
    
    for embedding in embeddings:
        user_match = await find_matching_user(embedding, threshold)
        if user_match:
            # Check if already marked today
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            existing = await db.attendance.find_one({
                "user_id": user_match['id'],
                "timestamp": {"$gte": today_start.isoformat()}
            })
            
            if existing:
                marked_users.append({**user_match, "status": "already_marked"})
                continue
            
            # Create attendance record
            record = AttendanceRecord(
                user_id=user_match['id'],
                username=user_match['username'],
                full_name=user_match['full_name'],
                confidence=user_match['confidence'],
                status="present"
            )
            
            doc = record.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.attendance.insert_one(doc)
            
            marked_users.append({**user_match, "status": "marked"})
    
    return {"message": f"Attendance marked for {len(marked_users)} user(s)", "users": marked_users}

@api_router.get("/attendance/history")
async def get_attendance_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Non-admin users can only see their own attendance
    if current_user['role'] != 'admin':
        query['user_id'] = current_user['id']
    elif user_id:
        query['user_id'] = user_id
    
    if start_date:
        query.setdefault('timestamp', {})['$gte'] = start_date
    if end_date:
        query.setdefault('timestamp', {})['$lte'] = end_date
    
    records = await db.attendance.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return records

@api_router.get("/attendance/report")
async def get_attendance_report(current_user: dict = Depends(get_admin_user)):
    # Get all users
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Get today's attendance
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = await db.attendance.find({
        "timestamp": {"$gte": today_start.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    marked_user_ids = {record['user_id'] for record in today_attendance}
    
    report = {
        "total_users": len(users),
        "present": len(marked_user_ids),
        "absent": len(users) - len(marked_user_ids),
        "present_users": today_attendance,
        "absent_users": [u for u in users if u['id'] not in marked_user_ids]
    }
    
    return report

# Settings Routes
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        doc = default_settings.model_dump()
        await db.settings.insert_one(doc)
        return default_settings
    return settings

@api_router.put("/settings")
async def update_settings(settings: Settings, current_user: dict = Depends(get_admin_user)):
    await db.settings.update_one(
        {"id": "default"},
        {"$set": settings.model_dump()},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

# Dashboard Stats
@api_router.get("/admin/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = await db.attendance.count_documents({
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    # Last 7 days attendance
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_records = await db.attendance.find({
        "timestamp": {"$gte": week_start}
    }, {"_id": 0}).to_list(1000)
    
    # Group by date
    daily_stats = {}
    for record in week_records:
        date = record['timestamp'][:10]
        daily_stats[date] = daily_stats.get(date, 0) + 1
    
    return {
        "total_users": total_users,
        "today_present": today_attendance,
        "today_absent": total_users - today_attendance,
        "weekly_stats": daily_stats
    }

@api_router.get("/")
async def root():
    return {"message": "Face Recognition Attendance System API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()