"""
Standardized API Response Helpers.
Ensures uniform REST format:
Success: { "success": true, "data": ..., "message": ... }
Error:   { "success": false, "error": { "code": ..., "message": ... } }
"""

from rest_framework.response import Response
from rest_framework import status


def api_success(data=None, message="Operation successful", status_code=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "data": data if data is not None else {},
            "message": message
        },
        status=status_code
    )


def api_error(code="BAD_REQUEST", message="An error occurred", status_code=status.HTTP_400_BAD_REQUEST, details=None):
    payload = {
        "code": code,
        "message": message
    }
    if details:
        payload["details"] = details

    return Response(
        {
            "success": False,
            "error": payload
        },
        status=status_code
    )
