from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.services.sign_services import predict_frame_sequence


router = APIRouter()


@router.post("/predict-sequence")
async def predict_sequence(frames: List[UploadFile] = File(...)):
    """Predict one ASL sign from chronological, unmirrored webcam frames."""
    if not frames:
        raise HTTPException(status_code=422, detail="Provide at least one frame.")

    # A bounded request protects the API from accidentally receiving a long
    # recording while still allowing the exact 60-frame trained window.
    if len(frames) > 90:
        raise HTTPException(status_code=422, detail="Send no more than 90 frames.")

    try:
        frame_bytes = [await frame.read() for frame in frames]
        return predict_frame_sequence(frame_bytes)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
