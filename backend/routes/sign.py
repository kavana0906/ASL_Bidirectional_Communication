from fastapi import APIRouter, UploadFile, File

from backend.services.sign_services import predict_image


router = APIRouter()


@router.post("/predict")
async def predict(image: UploadFile = File(...)):

    # Read uploaded image
    image_bytes = await image.read()

    print(
        f"Received image: {image.filename}"
    )

    print(
        f"Image size: {len(image_bytes)} bytes"
    )

    # Run ASL model
    result = predict_image(
        image_bytes
    )

    return result