from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

# KITA GANTI PREFIX MENJADI /users AGAR TIDAK DIBJAK CLOUDFLARE
router = APIRouter(prefix="/users", tags=["users"])

@router.post("/sync", response_model=schemas.UserRead)
def sync_user(user_req: schemas.UserSyncRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_req.email).first()
    
    if not user:
        # Otomatis jadikan admin & langsung approve jika email mengandung nama Anda
        is_owner = "adryan" in user_req.email.lower() or "arya" in user_req.email.lower()
        
        user = models.User(
            email=user_req.email,
            name=user_req.name,
            image=user_req.image,
            provider=user_req.provider,
            role="admin" if is_owner else "user",
            is_approved=is_owner  # Langsung True untuk Anda!
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

@router.get("/", response_model=list[schemas.UserRead])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

@router.patch("/{user_id}/approve", response_model=schemas.UserRead)
def approve_user(user_id: int, approval: schemas.UserApprovalRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    user.is_approved = approval.is_approved
    db.commit()
    db.refresh(user)
    return user
