from pydantic import BaseModel, Field
from typing import Optional


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., json_schema_extra={"example": "ok"})
    model_ready: bool = Field(..., json_schema_extra={"example": True})
    model_name: str = Field(..., json_schema_extra={"example": "u2net"})
    version: str = Field("1.0.0", json_schema_extra={"example": "1.0.0"})


class ErrorResponse(BaseModel):
    """Safe, structured error response schema."""
    detail: str = Field(..., json_schema_extra={"example": "Invalid image file format"})
    error_code: str = Field(..., json_schema_extra={"example": "INVALID_FORMAT"})
    help: Optional[str] = Field(None, json_schema_extra={"example": "Please upload a valid JPG, PNG, or WEBP image under 15MB."})
