import os
import requests
import jwt  # pip install pyjwt
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from dotenv import load_dotenv

# load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin API"])

# Use secure environment variable practices in production.
CLERK_API_KEY = os.getenv("CLERK_API_KEY", os.getenv("CLERK_API_KEY"))
CLERK_API_URL = os.getenv("CLERK_API_URL", "https://api.clerk.dev/v1")

def verify_admin(authorization: str = Header(...)):
    """
    Dependency that:
    1. Extracts the Clerk token from the Authorization header.
    2. Decodes the token (for demo purposes, signature verification is disabled).
    3. Fetches the user's organization memberships from Clerk API.
    4. Checks that the user is a member of an organization with name "status24".
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'."
        )
    token = parts[1]
    try:
        # WARNING: Disable signature verification only for demonstration.
        decoded_token = jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token decode failed: {str(e)}"
        )
    user_id = decoded_token.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )

    # Fetch the user's organization memberships from Clerk.
    clerk_resp = requests.get(
        f"{CLERK_API_URL}/users/{user_id}/organization_memberships",
        headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
    )
    if clerk_resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Failed to fetch user organization memberships from Clerk"
        )
    # Expecting a payload with a "data" key containing org memberships.
    org_memberships = clerk_resp.json().get("data", [])
    authorized = False
    for membership in org_memberships:
        org = membership.get("organization")
        if org and org.get("name") == "status24":
            authorized = True
            break

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized. Admin access required (org must be status24)."
        )
    # If authorized, return the user_id for further use.
    return user_id

# ---------------------------
# Pydantic Models for Requests
# ---------------------------
class CreateUserRequest(BaseModel):
    email: str
    name: str

class CreateOrgRequest(BaseModel):
    orgName: str

class AddUserToOrgRequest(BaseModel):
    orgId: str
    email: str
    name: str

# ---------------------------
# Admin Endpoints Using Clerk API
# ---------------------------
@router.post("/create-user")
def create_user(payload: CreateUserRequest, user_id: str = Depends(verify_admin)):
    """
    Create a new user in the status24 organization using Clerk's API.
    """
    # Example payload: adjust based on Clerk API documentation.
    clerk_api_payload = {
        "email_address": payload.email,
        # Split the name into first and last if possible.
        "first_name": payload.name.split()[0],
        "last_name": payload.name.split()[1] if len(payload.name.split()) > 1 else "",
        "public_metadata": {"organization": "status24"}
    }
    clerk_resp = requests.post(
        f"{CLERK_API_URL}/users",
        headers={
            "Authorization": f"Bearer {CLERK_API_KEY}",
            "Content-Type": "application/json"
        },
        json=clerk_api_payload
    )
    if clerk_resp.status_code < 200 or clerk_resp.status_code >= 300:
        raise HTTPException(
            status_code=clerk_resp.status_code,
            detail=f"Error creating user: {clerk_resp.text}"
        )
    return clerk_resp.json()

@router.post("/create-org")
def create_org(payload: CreateOrgRequest, user_id: str = Depends(verify_admin)):
    """
    Create a new organization using Clerk's API.
    """
    clerk_api_payload = {
        "name": payload.orgName,
    }
    clerk_resp = requests.post(
        f"{CLERK_API_URL}/organizations",
        headers={
            "Authorization": f"Bearer {CLERK_API_KEY}",
            "Content-Type": "application/json"
        },
        json=clerk_api_payload
    )
    if clerk_resp.status_code < 200 or clerk_resp.status_code >= 300:
        raise HTTPException(
            status_code=clerk_resp.status_code,
            detail=f"Error creating organization: {clerk_resp.text}"
        )
    return clerk_resp.json()

@router.post("/add-user-to-org")
def add_user_to_org(payload: AddUserToOrgRequest, user_id: str = Depends(verify_admin)):
    """
    Add a user to a specific organization using Clerk's API.
    """
    # Example payload for adding a user to an organization.
    # Adjust the payload keys as per Clerk's current API spec.
    clerk_api_payload = {
        "email_address": payload.email,
        "organization_id": payload.orgId,
        "public_metadata": {"full_name": payload.name}
    }
    clerk_resp = requests.post(
        f"{CLERK_API_URL}/organization_memberships",
        headers={
            "Authorization": f"Bearer {CLERK_API_KEY}",
            "Content-Type": "application/json"
        },
        json=clerk_api_payload
    )
    if clerk_resp.status_code < 200 or clerk_resp.status_code >= 300:
        raise HTTPException(
            status_code=clerk_resp.status_code,
            detail=f"Error adding user to organization: {clerk_resp.text}"
        )
    return clerk_resp.json()

@router.get("/organizations")
def list_organizations(user_id: str = Depends(verify_admin)):
    """
    Fetch a list of organizations from Clerk to populate the select element.
    Returns a simplified list of organizations with id and name.
    """
    clerk_resp = requests.get(
        f"{CLERK_API_URL}/organizations",
        headers={
            "Authorization": f"Bearer {CLERK_API_KEY}"
        }
    )
    if clerk_resp.status_code != 200:
        raise HTTPException(
            status_code=clerk_resp.status_code,
            detail="Error fetching organizations from Clerk"
        )
    # Assume Clerk API returns { "data": [ { "id": "...", "name": "..." }, ... ] }
    orgs_data = clerk_resp.json().get("data", [])
    # Simplify the list for frontend usage
    organizations = [{"id": org.get("id"), "name": org.get("name")} for org in orgs_data]
    return {"organizations": organizations} 