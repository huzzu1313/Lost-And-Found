#!/usr/bin/env python3
"""
Lost & Found Backend API Testing Suite
Tests all backend endpoints with authentication, file upload, and CRUD operations
"""

import requests
import json
import os
import tempfile
from io import BytesIO
import uuid
import time

# Configuration
BASE_URL = "https://recoverhub-4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test data
ADMIN_EMAIL = "admin@lostandfound.com"
ADMIN_PASSWORD = "admin123456"
ADMIN_NAME = "Admin User"

REGULAR_EMAIL = "john.doe@example.com"
REGULAR_PASSWORD = "password123"
REGULAR_NAME = "John Doe"

class LostFoundAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.regular_token = None
        self.test_item_id = None
        self.uploaded_file_url = None
        
    def log_test(self, test_name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")
        print()
        
    def test_user_registration(self):
        """Test 1: User Registration - Test with regular email and admin email"""
        print("=== Testing User Registration ===")
        
        # Test regular user registration
        try:
            regular_user_data = {
                "email": REGULAR_EMAIL,
                "password": REGULAR_PASSWORD,
                "name": REGULAR_NAME
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=regular_user_data)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("user") and data["user"]["role"] == "user":
                    self.log_test("Regular User Registration", True, f"User created with role: {data['user']['role']}")
                else:
                    self.log_test("Regular User Registration", False, f"Unexpected response: {data}")
            else:
                self.log_test("Regular User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Regular User Registration", False, f"Exception: {str(e)}")
            
        # Test admin user registration
        try:
            admin_user_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "name": ADMIN_NAME
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=admin_user_data)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("user") and data["user"]["role"] == "admin":
                    self.log_test("Admin User Registration", True, f"Admin user created with role: {data['user']['role']}")
                else:
                    self.log_test("Admin User Registration", False, f"Admin role not assigned: {data}")
            else:
                # Admin might already exist, check if it's a duplicate error
                if response.status_code == 500 and "already exists" in response.text:
                    self.log_test("Admin User Registration", True, "Admin user already exists (expected)")
                else:
                    self.log_test("Admin User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            self.log_test("Admin User Registration", False, f"Exception: {str(e)}")
            
        # Test validation - missing fields
        try:
            invalid_data = {"email": "test@test.com"}  # Missing password and name
            response = self.session.post(f"{API_BASE}/auth/register", json=invalid_data)
            
            if response.status_code == 400:
                self.log_test("Registration Validation (Missing Fields)", True, "Correctly rejected missing fields")
            else:
                self.log_test("Registration Validation (Missing Fields)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Registration Validation (Missing Fields)", False, f"Exception: {str(e)}")
            
        # Test validation - short password
        try:
            invalid_data = {
                "email": "test2@test.com",
                "password": "123",  # Too short
                "name": "Test User"
            }
            response = self.session.post(f"{API_BASE}/auth/register", json=invalid_data)
            
            if response.status_code == 400:
                self.log_test("Registration Validation (Short Password)", True, "Correctly rejected short password")
            else:
                self.log_test("Registration Validation (Short Password)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Registration Validation (Short Password)", False, f"Exception: {str(e)}")
    
    def get_csrf_token(self, session):
        """Get CSRF token for NextAuth"""
        try:
            response = session.get(f"{API_BASE}/auth/csrf")
            if response.status_code == 200:
                return response.json().get('csrfToken', '')
        except:
            pass
        return ''
    
    def login_user(self, email, password):
        """Login user and return authenticated session"""
        session = requests.Session()
        
        # Get CSRF token
        csrf_token = self.get_csrf_token(session)
        
        # Login with CSRF token
        login_data = {
            'email': email,
            'password': password,
            'csrfToken': csrf_token,
            'callbackUrl': f'{BASE_URL}/',
            'json': 'true'
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        response = session.post(
            f"{API_BASE}/auth/callback/credentials", 
            data=login_data,
            headers=headers,
            allow_redirects=False
        )
        
        if response.status_code == 200:
            # Verify session
            session_response = session.get(f"{API_BASE}/auth/session")
            if session_response.status_code == 200:
                session_data = session_response.json()
                if session_data and session_data.get('user'):
                    return session, session_data['user']
        
        return None, None

    def test_nextauth_login(self):
        """Test 2: NextAuth Login - Test credentials provider"""
        print("=== Testing NextAuth Login ===")
        
        # Test regular user login
        try:
            session, user_data = self.login_user(REGULAR_EMAIL, REGULAR_PASSWORD)
            
            if session and user_data:
                if user_data.get('role') == 'user':
                    self.log_test("Regular User Login", True, f"Login successful - User: {user_data['name']}, Role: {user_data['role']}")
                    self.regular_token = session
                else:
                    self.log_test("Regular User Login", False, f"Unexpected role: {user_data.get('role')}")
            else:
                self.log_test("Regular User Login", False, "Login failed - no session established")
                
        except Exception as e:
            self.log_test("Regular User Login", False, f"Exception: {str(e)}")
            
        # Test admin user login
        try:
            session, user_data = self.login_user(ADMIN_EMAIL, ADMIN_PASSWORD)
            
            if session and user_data:
                if user_data.get('role') == 'admin':
                    self.log_test("Admin User Login", True, f"Admin login successful - User: {user_data['name']}, Role: {user_data['role']}")
                    self.admin_token = session
                else:
                    self.log_test("Admin User Login", False, f"Admin role not assigned: {user_data.get('role')}")
            else:
                self.log_test("Admin User Login", False, "Admin login failed - no session established")
                
        except Exception as e:
            self.log_test("Admin User Login", False, f"Exception: {str(e)}")
            
        # Test invalid credentials
        try:
            session, user_data = self.login_user(REGULAR_EMAIL, "wrongpassword")
            
            if not session or not user_data:
                self.log_test("Invalid Credentials Login", True, "Correctly rejected invalid credentials")
            else:
                self.log_test("Invalid Credentials Login", False, "Invalid credentials were accepted")
                
        except Exception as e:
            self.log_test("Invalid Credentials Login", False, f"Exception: {str(e)}")
    
    def test_file_upload(self):
        """Test 3: File Upload - Test with authenticated user"""
        print("=== Testing File Upload ===")
        
        if not self.regular_token:
            self.log_test("File Upload (No Session)", False, "No valid session available for testing")
            return
            
        try:
            # Create a test image file
            test_image_content = b"fake_image_content_for_testing"
            
            files = {
                'file': ('test_image.jpg', BytesIO(test_image_content), 'image/jpeg')
            }
            
            response = self.regular_token.post(f"{API_BASE}/upload", files=files)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("url") and data["url"].startswith("/uploads/"):
                    self.uploaded_file_url = data["url"]
                    self.log_test("File Upload (Authenticated)", True, f"File uploaded successfully: {data['url']}")
                else:
                    self.log_test("File Upload (Authenticated)", False, f"Invalid response format: {data}")
            else:
                self.log_test("File Upload (Authenticated)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("File Upload (Authenticated)", False, f"Exception: {str(e)}")
            
        # Test upload without authentication
        try:
            files = {
                'file': ('test_image2.jpg', BytesIO(b"test_content"), 'image/jpeg')
            }
            
            unauth_session = requests.Session()
            response = unauth_session.post(f"{API_BASE}/upload", files=files)
            
            if response.status_code == 401:
                self.log_test("File Upload (Unauthenticated)", True, "Correctly rejected unauthenticated upload")
            else:
                self.log_test("File Upload (Unauthenticated)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("File Upload (Unauthenticated)", False, f"Exception: {str(e)}")
            
        # Test upload without file
        try:
            response = self.regular_token.post(f"{API_BASE}/upload", files={})
            
            if response.status_code == 400:
                self.log_test("File Upload (No File)", True, "Correctly rejected empty upload")
            else:
                self.log_test("File Upload (No File)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("File Upload (No File)", False, f"Exception: {str(e)}")
    
    def test_create_item(self):
        """Test 4: Create Item - Test with and without image"""
        print("=== Testing Create Item ===")
        
        if not self.regular_token:
            self.log_test("Create Item (No Session)", False, "No valid session available for testing")
            return
            
        # Test create item with image
        try:
            item_data = {
                "title": "Lost iPhone 13",
                "description": "Black iPhone 13 lost near Central Park",
                "category": "Electronics",
                "status": "lost",
                "location": "Central Park, NYC",
                "date": "2024-01-15",
                "image": self.uploaded_file_url,
                "contactInfo": "john.doe@example.com"
            }
            
            response = self.regular_token.post(f"{API_BASE}/items", json=item_data)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("item") and data["item"].get("id"):
                    self.test_item_id = data["item"]["id"]
                    self.log_test("Create Item (With Image)", True, f"Item created successfully: {data['item']['id']}")
                else:
                    self.log_test("Create Item (With Image)", False, f"Invalid response format: {data}")
            else:
                self.log_test("Create Item (With Image)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create Item (With Image)", False, f"Exception: {str(e)}")
            
        # Test create item without image
        try:
            item_data_no_image = {
                "title": "Found Wallet",
                "description": "Brown leather wallet found on Main Street",
                "category": "Personal Items",
                "status": "found",
                "location": "Main Street",
                "date": "2024-01-16"
            }
            
            response = self.regular_token.post(f"{API_BASE}/items", json=item_data_no_image)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("item") and data["item"]["image"] is None:
                    self.log_test("Create Item (Without Image)", True, "Item created successfully without image")
                else:
                    self.log_test("Create Item (Without Image)", False, f"Unexpected image field: {data}")
            else:
                self.log_test("Create Item (Without Image)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create Item (Without Image)", False, f"Exception: {str(e)}")
            
        # Test create item without authentication
        try:
            unauth_session = requests.Session()
            response = unauth_session.post(f"{API_BASE}/items", json=item_data)
            
            if response.status_code == 401:
                self.log_test("Create Item (Unauthenticated)", True, "Correctly rejected unauthenticated creation")
            else:
                self.log_test("Create Item (Unauthenticated)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Item (Unauthenticated)", False, f"Exception: {str(e)}")
            
        # Test create item with missing fields
        try:
            invalid_item = {
                "title": "Test Item"
                # Missing required fields
            }
            
            response = self.regular_token.post(f"{API_BASE}/items", json=invalid_item)
            
            if response.status_code == 400:
                self.log_test("Create Item (Missing Fields)", True, "Correctly rejected missing required fields")
            else:
                self.log_test("Create Item (Missing Fields)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Item (Missing Fields)", False, f"Exception: {str(e)}")
    
    def test_get_items_with_filters(self):
        """Test 5: Get Items with Filters - Test search, category, location, status filters"""
        print("=== Testing Get Items with Filters ===")
        
        try:
            # Test get all items
            response = self.session.get(f"{API_BASE}/items")
            
            if response.status_code == 200:
                data = response.json()
                if "items" in data and isinstance(data["items"], list):
                    self.log_test("Get All Items", True, f"Retrieved {len(data['items'])} items")
                else:
                    self.log_test("Get All Items", False, f"Invalid response format: {data}")
            else:
                self.log_test("Get All Items", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get All Items", False, f"Exception: {str(e)}")
            
        # Test search filter
        try:
            response = self.session.get(f"{API_BASE}/items?search=iPhone")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Search Filter", True, f"Search returned {len(data['items'])} items")
            else:
                self.log_test("Search Filter", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Search Filter", False, f"Exception: {str(e)}")
            
        # Test category filter
        try:
            response = self.session.get(f"{API_BASE}/items?category=Electronics")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Category Filter", True, f"Category filter returned {len(data['items'])} items")
            else:
                self.log_test("Category Filter", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Category Filter", False, f"Exception: {str(e)}")
            
        # Test location filter
        try:
            response = self.session.get(f"{API_BASE}/items?location=Central Park, NYC")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Location Filter", True, f"Location filter returned {len(data['items'])} items")
            else:
                self.log_test("Location Filter", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Location Filter", False, f"Exception: {str(e)}")
            
        # Test status filter
        try:
            response = self.session.get(f"{API_BASE}/items?status=lost")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Status Filter", True, f"Status filter returned {len(data['items'])} items")
            else:
                self.log_test("Status Filter", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Status Filter", False, f"Exception: {str(e)}")
            
        # Test verified filter
        try:
            response = self.session.get(f"{API_BASE}/items?verified=true")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Verified Filter", True, f"Verified filter returned {len(data['items'])} items")
            else:
                self.log_test("Verified Filter", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Verified Filter", False, f"Exception: {str(e)}")
            
        # Test combined filters
        try:
            response = self.session.get(f"{API_BASE}/items?search=iPhone&category=Electronics&status=lost")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Combined Filters", True, f"Combined filters returned {len(data['items'])} items")
            else:
                self.log_test("Combined Filters", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Combined Filters", False, f"Exception: {str(e)}")
    
    def test_get_single_item(self):
        """Test 6: Get Single Item"""
        print("=== Testing Get Single Item ===")
        
        if not self.test_item_id:
            self.log_test("Get Single Item (No Test Item)", False, "No test item ID available")
            return
            
        try:
            response = self.session.get(f"{API_BASE}/items/{self.test_item_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("item") and data["item"]["id"] == self.test_item_id:
                    self.log_test("Get Single Item (Valid ID)", True, f"Retrieved item: {data['item']['title']}")
                else:
                    self.log_test("Get Single Item (Valid ID)", False, f"Invalid response: {data}")
            else:
                self.log_test("Get Single Item (Valid ID)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Single Item (Valid ID)", False, f"Exception: {str(e)}")
            
        # Test get non-existent item
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.get(f"{API_BASE}/items/{fake_id}")
            
            if response.status_code == 404:
                self.log_test("Get Single Item (Invalid ID)", True, "Correctly returned 404 for non-existent item")
            else:
                self.log_test("Get Single Item (Invalid ID)", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Single Item (Invalid ID)", False, f"Exception: {str(e)}")
    
    def test_update_item(self):
        """Test 7: Update Item - Test as owner, admin, and unauthorized"""
        print("=== Testing Update Item ===")
        
        if not self.test_item_id:
            self.log_test("Update Item (No Test Item)", False, "No test item ID available")
            return
            
        # Test update as owner (regular user)
        try:
            update_data = {
                "title": "Lost iPhone 13 - UPDATED",
                "description": "Updated description"
            }
            
            response = self.regular_token.put(f"{API_BASE}/items/{self.test_item_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("item") and "UPDATED" in data["item"]["title"]:
                    self.log_test("Update Item (As Owner)", True, "Item updated successfully by owner")
                else:
                    self.log_test("Update Item (As Owner)", False, f"Update not reflected: {data}")
            else:
                self.log_test("Update Item (As Owner)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Update Item (As Owner)", False, f"Exception: {str(e)}")
            
        # Test update as admin
        if self.admin_token:
            try:
                admin_update = {
                    "verified": True,
                    "title": "Lost iPhone 13 - ADMIN VERIFIED"
                }
                
                response = self.admin_token.put(f"{API_BASE}/items/{self.test_item_id}", json=admin_update)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("item") and data["item"].get("verified") == True:
                        self.log_test("Update Item (As Admin)", True, "Item updated successfully by admin")
                    else:
                        self.log_test("Update Item (As Admin)", False, f"Admin update not reflected: {data}")
                else:
                    self.log_test("Update Item (As Admin)", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test("Update Item (As Admin)", False, f"Exception: {str(e)}")
        else:
            self.log_test("Update Item (As Admin)", False, "No admin session available")
            
        # Test update without authentication
        try:
            unauth_session = requests.Session()
            response = unauth_session.put(f"{API_BASE}/items/{self.test_item_id}", json={"title": "Unauthorized update"})
            
            if response.status_code == 401:
                self.log_test("Update Item (Unauthenticated)", True, "Correctly rejected unauthenticated update")
            else:
                self.log_test("Update Item (Unauthenticated)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Update Item (Unauthenticated)", False, f"Exception: {str(e)}")
            
        # Test update non-existent item
        try:
            fake_id = str(uuid.uuid4())
            response = self.regular_token.put(f"{API_BASE}/items/{fake_id}", json={"title": "Update non-existent"})
            
            if response.status_code == 404:
                self.log_test("Update Item (Non-existent)", True, "Correctly returned 404 for non-existent item")
            else:
                self.log_test("Update Item (Non-existent)", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Update Item (Non-existent)", False, f"Exception: {str(e)}")
    
    def test_delete_item(self):
        """Test 8: Delete Item - Test as owner, admin, and unauthorized"""
        print("=== Testing Delete Item ===")
        
        # First create a test item for deletion
        delete_test_item_id = None
        
        if self.regular_token:
            try:
                item_data = {
                    "title": "Test Item for Deletion",
                    "description": "This item will be deleted",
                    "category": "Test",
                    "status": "lost",
                    "location": "Test Location",
                    "date": "2024-01-17"
                }
                
                create_session = requests.Session()
                create_session.cookies.update(self.regular_token)
                
                response = create_session.post(f"{API_BASE}/items", json=item_data)
                
                if response.status_code == 201:
                    data = response.json()
                    delete_test_item_id = data["item"]["id"]
                    self.log_test("Create Item for Deletion Test", True, f"Created test item: {delete_test_item_id}")
                else:
                    self.log_test("Create Item for Deletion Test", False, f"Failed to create test item: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Create Item for Deletion Test", False, f"Exception: {str(e)}")
        
        if not delete_test_item_id:
            self.log_test("Delete Item Tests", False, "No test item available for deletion tests")
            return
            
        # Test delete without authentication
        try:
            unauth_session = requests.Session()
            response = unauth_session.delete(f"{API_BASE}/items/{delete_test_item_id}")
            
            if response.status_code == 401:
                self.log_test("Delete Item (Unauthenticated)", True, "Correctly rejected unauthenticated deletion")
            else:
                self.log_test("Delete Item (Unauthenticated)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Delete Item (Unauthenticated)", False, f"Exception: {str(e)}")
            
        # Test delete as owner
        try:
            owner_session = requests.Session()
            owner_session.cookies.update(self.regular_token)
            
            response = owner_session.delete(f"{API_BASE}/items/{delete_test_item_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "deleted successfully" in data.get("message", ""):
                    self.log_test("Delete Item (As Owner)", True, "Item deleted successfully by owner")
                    
                    # Verify item is actually deleted
                    verify_response = self.session.get(f"{API_BASE}/items/{delete_test_item_id}")
                    if verify_response.status_code == 404:
                        self.log_test("Delete Item Verification", True, "Item confirmed deleted")
                    else:
                        self.log_test("Delete Item Verification", False, "Item still exists after deletion")
                else:
                    self.log_test("Delete Item (As Owner)", False, f"Unexpected response: {data}")
            else:
                self.log_test("Delete Item (As Owner)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Delete Item (As Owner)", False, f"Exception: {str(e)}")
            
        # Test delete non-existent item
        try:
            fake_id = str(uuid.uuid4())
            owner_session = requests.Session()
            owner_session.cookies.update(self.regular_token)
            
            response = owner_session.delete(f"{API_BASE}/items/{fake_id}")
            
            if response.status_code == 404:
                self.log_test("Delete Item (Non-existent)", True, "Correctly returned 404 for non-existent item")
            else:
                self.log_test("Delete Item (Non-existent)", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Delete Item (Non-existent)", False, f"Exception: {str(e)}")
            
        # Test admin delete (create another item first)
        if self.admin_token:
            try:
                # Create item as regular user
                item_data = {
                    "title": "Item for Admin Deletion",
                    "description": "This item will be deleted by admin",
                    "category": "Test",
                    "status": "found",
                    "location": "Admin Test Location",
                    "date": "2024-01-18"
                }
                
                create_session = requests.Session()
                create_session.cookies.update(self.regular_token)
                
                response = create_session.post(f"{API_BASE}/items", json=item_data)
                
                if response.status_code == 201:
                    admin_delete_item_id = response.json()["item"]["id"]
                    
                    # Delete as admin
                    admin_session = requests.Session()
                    admin_session.cookies.update(self.admin_token)
                    
                    delete_response = admin_session.delete(f"{API_BASE}/items/{admin_delete_item_id}")
                    
                    if delete_response.status_code == 200:
                        self.log_test("Delete Item (As Admin)", True, "Item deleted successfully by admin")
                    else:
                        self.log_test("Delete Item (As Admin)", False, f"Admin delete failed: {delete_response.status_code}")
                else:
                    self.log_test("Delete Item (As Admin)", False, "Failed to create item for admin deletion test")
                    
            except Exception as e:
                self.log_test("Delete Item (As Admin)", False, f"Exception: {str(e)}")
        else:
            self.log_test("Delete Item (As Admin)", False, "No admin session available")
    
    def run_all_tests(self):
        """Run all backend API tests in priority order"""
        print("🚀 Starting Lost & Found Backend API Tests")
        print("=" * 60)
        
        # Test in priority order as specified
        self.test_user_registration()
        self.test_nextauth_login()
        self.test_file_upload()
        self.test_create_item()
        self.test_get_items_with_filters()
        self.test_get_single_item()
        self.test_update_item()
        self.test_delete_item()
        
        print("=" * 60)
        print("🏁 Backend API Testing Complete")

if __name__ == "__main__":
    tester = LostFoundAPITester()
    tester.run_all_tests()