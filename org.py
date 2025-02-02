import os
import requests
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from dotenv import load_dotenv
from google.cloud import firestore
from datetime import datetime
from typing import Optional

db = firestore.Client()

router = APIRouter(prefix="/org", tags=["Organization API"])

CLERK_API_KEY = os.getenv("CLERK_API_KEY", os.getenv("CLERK_API_KEY"))
CLERK_API_URL = os.getenv("CLERK_API_URL", "https://api.clerk.dev/v1")

def verify_org_member(authorization: str = Header(...)):
    """
    Dependency that:
    1. Extracts the Clerk token from the Authorization header
    2. Verifies the token and gets user's organization membership
    3. Returns the first organization membership
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

    # Fetch the user's organization memberships from Clerk
    clerk_resp = requests.get(
        f"{CLERK_API_URL}/users/{user_id}/organization_memberships",
        headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
    )
    
    if clerk_resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Failed to fetch user organization memberships from Clerk"
        )
    
    org_memberships = clerk_resp.json().get("data", [])
    if not org_memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of any organization"
        )
    
    # Return only the first organization membership
    return org_memberships[0]

class ServiceCreate(BaseModel):
    organizationId: str
    name: str
    type: str
    status: str

@router.post("/add-service")
async def add_service(
    service: ServiceCreate,
    org_membership: dict = Depends(verify_org_member)
):
    """
    Add a new service to an organization.
    Verifies that the user is a member of the organization they're adding the service to.
    """
    org = org_membership.get("organization", {})
    if org.get("id") != service.organizationId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to add services to this organization"
        )

    try:
        # Reference to the organization document
        org_ref = db.collection("organizations").document(service.organizationId)
        
        # Check if organization document exists, if not create it
        org_doc = org_ref.get()
        if not org_doc.exists:
            org_ref.set({
                "services": {}
            })
        elif "services" not in org_doc.to_dict():
            # If document exists but no services field, initialize it
            org_ref.update({
                "services": {}
            })
        
        # Generate a unique ID for the service
        service_id = db.collection("_").document().id

        service_data = {
            "id": service_id,
            "name": service.name,
            "type": service.type,
            "status": service.status,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        # Update the organization document to add the new service
        org_ref.update({
            f"services.{service_id}": service_data
        })
        
        # Return without SERVER_TIMESTAMP
        response_data = {
            **service_data,
            "created_at": None,
            "updated_at": None
        }
        
        return {
            "status": "success",
            "message": "Service added successfully",
            "data": response_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add service: {str(e)}"
        )

class ServiceUpdate(BaseModel):
    serviceId: str
    organizationId: str
    status: str

@router.put("/update-service")
async def update_service(
    service: ServiceUpdate,
    org_membership: dict = Depends(verify_org_member)
):
    """
    Update a service's status in an organization.
    Verifies that the user is a member of the organization they're updating the service in.
    """
    org = org_membership.get("organization", {})
    if org.get("id") != service.organizationId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to update services in this organization"
        )

    try:
        org_ref = db.collection("organizations").document(service.organizationId)
        org_doc = org_ref.get()

        if not org_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )

        # Get the existing service data
        org_data = org_doc.to_dict()
        service_data = org_data.get("services", {}).get(service.serviceId)
        
        if not service_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )

        # Only update status and updated_at timestamp
        org_ref.update({
            f"services.{service.serviceId}.status": service.status,
            f"services.{service.serviceId}.updated_at": firestore.SERVER_TIMESTAMP
        })

        return {
            "status": "success",
            "message": "Service status updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update service: {str(e)}"
        )

class ServiceDelete(BaseModel):
    serviceId: str
    organizationId: str

@router.delete("/delete-service")
async def delete_service(
    service: ServiceDelete,
    org_membership: dict = Depends(verify_org_member)
):
    """
    Delete a service from an organization.
    """
    org = org_membership.get("organization", {})
    if org.get("id") != service.organizationId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to delete services in this organization"
        )

    try:
        org_ref = db.collection("organizations").document(service.organizationId)
        
        # Delete the service using FieldValue.delete()
        org_ref.update({
            f"services.{service.serviceId}": firestore.DELETE_FIELD
        })

        return {
            "status": "success",
            "message": "Service deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete service: {str(e)}"
        )

class IncidentCreate(BaseModel):
    organizationId: str
    title: str
    description: str
    status: str
    datetime: datetime
    affectedServices: list[str]

@router.post("/add-incident")
async def add_incident(
    incident: IncidentCreate,
    org_membership: dict = Depends(verify_org_member)
):
    """
    Add a new incident to an organization.
    Verifies that the user is a member of the organization they're adding the incident to.
    """
    org = org_membership.get("organization", {})
    if org.get("id") != incident.organizationId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to add incidents to this organization"
        )

    try:
        # Reference to the organization document
        org_ref = db.collection("organizations").document(incident.organizationId)
        
        # Check if organization document exists
        org_doc = org_ref.get()
        if not org_doc.exists:
            org_ref.set({
                "incidents": {}
            })
        elif "incidents" not in org_doc.to_dict():
            # If document exists but no incidents field, initialize it
            org_ref.update({
                "incidents": {}
            })
        
        # Generate a unique ID for the incident
        incident_id = db.collection("_").document().id

        incident_data = {
            "id": incident_id,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status,
            "datetime": incident.datetime,
            "affectedServices": incident.affectedServices,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        # Update the organization document to add the new incident
        org_ref.update({
            f"incidents.{incident_id}": incident_data
        })
        
        # Return without SERVER_TIMESTAMP
        response_data = {
            **incident_data,
            "created_at": None,
            "updated_at": None
        }
        
        return {
            "status": "success",
            "message": "Incident added successfully",
            "data": response_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add incident: {str(e)}"
        )

class IncidentUpdate(BaseModel):
    incidentId: str
    organizationId: str
    status: str
    message: str

@router.put("/update-incident")
async def update_incident(
    incident: IncidentUpdate,
    org_membership: dict = Depends(verify_org_member)
):
    """
    Update an incident's status and add a new message.
    Verifies that the user is a member of the organization they're updating the incident in.
    """
    org = org_membership.get("organization", {})
    if org.get("id") != incident.organizationId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to update incidents in this organization"
        )

    try:
        org_ref = db.collection("organizations").document(incident.organizationId)
        org_doc = org_ref.get()

        if not org_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )

        # Get the existing incident data
        org_data = org_doc.to_dict()
        incident_data = org_data.get("incidents", {}).get(incident.incidentId)
        
        if not incident_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )

        # Generate a unique ID for the message
        message_id = db.collection("_").document().id

        # Create the message data
        message_data = {
            "id": message_id,
            "message": incident.message,
            "status": incident.status,
            "timestamp": firestore.SERVER_TIMESTAMP,
        }

        # Initialize messages field if it doesn't exist
        if "messages" not in incident_data:
            org_ref.update({
                f"incidents.{incident.incidentId}.messages": {}
            })

        # Update incident status and add new message
        updates = {
            f"incidents.{incident.incidentId}.status": incident.status,
            f"incidents.{incident.incidentId}.updated_at": firestore.SERVER_TIMESTAMP,
            f"incidents.{incident.incidentId}.messages.{message_id}": message_data
        }

        # If status is "resolved", add resolved_at timestamp
        if incident.status == "resolved":
            updates[f"incidents.{incident.incidentId}.resolved_at"] = firestore.SERVER_TIMESTAMP

        org_ref.update(updates)

        return {
            "status": "success",
            "message": "Incident updated successfully",
            "data": {
                "messageId": message_id,
                "status": incident.status
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update incident: {str(e)}"
        )

# Add this router to your main.py