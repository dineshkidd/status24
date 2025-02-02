import os
from typing import Union

import requests
import jwt  # install with: pip install pyjwt
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.cloud import firestore
from admin import router as admin_router
from org import router as org_router


load_dotenv()
db = firestore.Client()
app = FastAPI()

firebase_secret = os.getenv("FIREBASE_SECRET")

# Configure CORS: Adjust origins as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to your frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLERK_API_KEY = os.getenv("CLERK_API_KEY", os.getenv("CLERK_API_KEY"))
CLERK_API_URL = os.getenv("CLERK_API_URL", "https://api.clerk.dev/v1")

app.include_router(admin_router)
app.include_router(org_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Status24 API"}



def get_current_user_org(authorization: str = Header(None)):
    """
    Dependency that:
    1. Extracts the Clerk token from the Authorization header.
    2. Decodes the token (in production, verify signature with Clerk's public keys).
    3. Retrieves the user's details securely from Clerk's API using the user id (sub claim).
    4. Returns the user's organization memberships.
    """

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
        )

    # Expecting header value in the form: "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
        )

    token = parts[1]

    try:
        # WARNING: For demonstration only.
        # In production, verify the token using Clerk's public keys.
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded_token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a user id.",
            )

        # Query Clerk's API for secure user data.
        clerk_response = requests.get(
            f"{CLERK_API_URL}/users/{user_id}/organization_memberships",
            headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
        )
        if clerk_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not verify user details from Clerk."
            )
        user_data = clerk_response.json().get("data", [])
        return user_data

    except Exception as e:
        print("Error processing token:", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials"
        )


@app.get("/user/org")
def get_user_org(org: Union[dict, None] = Depends(get_current_user_org)):
    """
    Endpoint that safely returns the user's organization.
    The organization is determined by securely querying Clerk's API on the backend.
    """
    if not org:
        return {"message": "User has no organization."}
    return {"organization": org}



@app.get("/organizations-list")
async def get_all_organizations():
    """
    Endpoint to retrieve all organization IDs from Firestore.
    Returns a list of organization IDs.
    """
    try:
        # Get reference to organizations collection
        orgs_ref = db.collection("organizations")
        # Get all documents
        docs = orgs_ref.stream()
        # Extract organization IDs
        org_ids = [doc.id for doc in docs]
        
        return {"organizations": org_ids}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organizations: {str(e)}"
        )
    
@app.get("/org-details")
async def get_org_details(org_id: str):
    """
    Endpoint to get organization details from Clerk API.
    Returns organization name and image URL.
    """
    try:
       
        clerk_base_url = "https://api.clerk.dev/v1"
        
        response = requests.get(
            f"{clerk_base_url}/organizations/{org_id}",
            headers={
                "Authorization": f"Bearer {CLERK_API_KEY}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
            
        org_data = response.json()
        return {
            "name": org_data.get("name"),
            "image_url": org_data.get("image_url"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organization details: {str(e)}"
        )
