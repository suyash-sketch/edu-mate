from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models import Assessment, User
from app.schemas import (
    AssessmentDetail,
    AssessmentHistoryItem,
    SaveAssessmentRequest,
)

router = APIRouter()

@router.post('/save')
def save_assessment(
    body: SaveAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_assessment = Assessment(
        user_id=current_user.id,
        chapter_name=body.chapter_name,
        bloom_factors=body.bloom_factors,
        content_json=body.content_json,
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return {"status": "saved", "id": new_assessment.id}


# ─── Helper: count MCQs safely ────────────────────────────────────────────────
def _count_questions(content_json) -> int:
    try:
        return len(content_json.get("mcqs", []))
    except Exception:
        return 0


# ─── Get assessments History ─────────────
@router.get("/history", response_model=List[AssessmentHistoryItem])
def get_history(
    current_user : User = Depends(get_current_user),
    db : Session = Depends(get_db)
):
    assessments = (
        db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    )

    return [
        AssessmentHistoryItem(
            id = a.id,
            chapter_name=a.chapter_name,
            questions=_count_questions(a.content_json),
            created_at=a.created_at,
            status="completed",
        )
        for a in assessments
    ]


@router.get('/{assessment_id}', response_model=AssessmentDetail)
def get_assessment(
    assessment_id : int,
    current_user : User = Depends(get_current_user),
    db : Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.user_id == current_user.id,
        ).first()
    )

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return AssessmentDetail(
        id=assessment.id,
        chapter_name=assessment.chapter_name,
        content=assessment.content_json,
    )