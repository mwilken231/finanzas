from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import (
    verify_password, hash_password, create_access_token,
    generate_api_key, get_current_user
)
from schemas import LoginRequest, TokenResponse, ChangePasswordRequest, ApiKeyResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    token = create_access_token({"sub": user.username})
    return TokenResponse(access_token=token)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Contraseña actualizada"}


@router.get("/api-key", response_model=ApiKeyResponse)
def get_api_key(current_user: User = Depends(get_current_user)):
    return ApiKeyResponse(api_key=current_user.api_key)


@router.post("/api-key/regenerate", response_model=ApiKeyResponse)
def regenerate_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.api_key = generate_api_key()
    db.commit()
    db.refresh(current_user)
    return ApiKeyResponse(api_key=current_user.api_key)
