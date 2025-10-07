#!/usr/bin/env python3
"""
Debug NextAuth authentication flow
"""

import requests
import json

BASE_URL = "https://recoverhub-4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def debug_nextauth():
    session = requests.Session()
    
    print("=== Debugging NextAuth Flow ===")
    
    # 1. Check NextAuth endpoints
    print("\n1. Testing NextAuth endpoints:")
    
    # Check session endpoint
    try:
        response = session.get(f"{API_BASE}/auth/session")
        print(f"GET /api/auth/session: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        print(f"Cookies: {dict(response.cookies)}")
    except Exception as e:
        print(f"Session endpoint error: {e}")
    
    # Check providers endpoint
    try:
        response = session.get(f"{API_BASE}/auth/providers")
        print(f"\nGET /api/auth/providers: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Providers endpoint error: {e}")
    
    # 2. Test CSRF token
    print("\n2. Getting CSRF token:")
    try:
        response = session.get(f"{API_BASE}/auth/csrf")
        print(f"GET /api/auth/csrf: {response.status_code}")
        csrf_data = response.json() if response.status_code == 200 else {}
        csrf_token = csrf_data.get('csrfToken', '')
        print(f"CSRF Token: {csrf_token[:50]}...")
        print(f"Cookies after CSRF: {dict(session.cookies)}")
    except Exception as e:
        print(f"CSRF error: {e}")
        csrf_token = ""
    
    # 3. Test signin with CSRF
    print("\n3. Testing signin with CSRF:")
    try:
        signin_data = {
            'email': 'john.doe@example.com',
            'password': 'password123',
            'csrfToken': csrf_token,
            'callbackUrl': f'{BASE_URL}/',
            'json': 'true'
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        response = session.post(
            f"{API_BASE}/auth/callback/credentials", 
            data=signin_data,
            headers=headers,
            allow_redirects=False
        )
        
        print(f"POST /api/auth/callback/credentials: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response: {response.text[:200]}")
        print(f"Cookies after signin: {dict(session.cookies)}")
        
        # Check for session cookies
        session_cookies = [name for name in session.cookies.keys() if 'next-auth' in name.lower()]
        print(f"NextAuth cookies: {session_cookies}")
        
    except Exception as e:
        print(f"Signin error: {e}")
    
    # 4. Test session after signin
    print("\n4. Testing session after signin:")
    try:
        response = session.get(f"{API_BASE}/auth/session")
        print(f"GET /api/auth/session (after signin): {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            session_data = response.json()
            if session_data and session_data.get('user'):
                print("✅ Session established successfully!")
                return session
            else:
                print("❌ No user in session")
        
    except Exception as e:
        print(f"Session check error: {e}")
    
    # 5. Test protected endpoint
    print("\n5. Testing protected endpoint:")
    try:
        response = session.get(f"{API_BASE}/items")
        print(f"GET /api/items: {response.status_code}")
        
        # Try upload endpoint
        files = {'file': ('test.txt', b'test content', 'text/plain')}
        response = session.post(f"{API_BASE}/upload", files=files)
        print(f"POST /api/upload: {response.status_code}")
        print(f"Upload response: {response.text[:100]}")
        
    except Exception as e:
        print(f"Protected endpoint error: {e}")
    
    return None

if __name__ == "__main__":
    debug_nextauth()