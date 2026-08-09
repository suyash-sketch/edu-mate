from datetime import timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    RESET_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
)
from app.core.security import (
    create_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.db.database import get_db
from app.models import User
from app.schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserResponse,
)

router = APIRouter()
# --- AUTHENTICATION ROUTES ---

@router.post("/signup", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(name=user.name, email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate the JWT Token granting access
    access_token = create_token(
        data={"sub": user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    # Security Best Practice: Never reveal if an email exists in your DB to prevent scraping
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    
    # Generate a temporary reset token
    reset_token = create_token(
        data={"sub": user.email, "type": "reset"}, 
        expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    )
    
    # Because we don't have an email server yet, we will print the link to the terminal!
    reset_link = f"http://localhost:8000/reset-password?token={reset_token}"
    print(f"\n\n*** PASSWORD RESET LINK FOR {user.email} ***\n{reset_link}\n\n")
    
    return {"reset_token": reset_token}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token hasn't expired and wasn't tampered with
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update the password
    user.password_hash = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been reset successfully"}