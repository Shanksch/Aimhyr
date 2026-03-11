"""
Utility script to test the Python API without frontend.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint."""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_get_roles():
    """Test get roles endpoint."""
    print("Testing get roles...")
    response = requests.get(f"{BASE_URL}/api/roles")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_main_questions():
    """Test main questions endpoint."""
    print("Testing main questions...")
    response = requests.post(
        f"{BASE_URL}/api/questions/main",
        json={
            "role": "Frontend Developer",
            "difficulty": "Medium"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_score():
    """Test scoring endpoint."""
    print("Testing score endpoint...")
    response = requests.post(
        f"{BASE_URL}/api/score",
        json={
            "transcript": "React is a JavaScript library for building user interfaces with reusable components. It uses JSX syntax and manages state using hooks like useState and useEffect.",
            "question": "Explain what React is and how it works",
            "role": "Frontend Developer",
            "difficulty": "Easy"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_followup():
    """Test followup question endpoint."""
    print("Testing followup endpoint...")
    response = requests.post(
        f"{BASE_URL}/api/questions/followup",
        json={
            "original_question": "Explain what React is",
            "answer_transcript": "React is a JavaScript library for building UIs with components",
            "role": "Frontend Developer",
            "difficulty": "Easy",
            "followup_count": 1
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("AI Interview Simulator - Python API Test Suite")
    print("=" * 60 + "\n")
    
    try:
        test_health()
        test_get_roles()
        test_main_questions()
        test_score()
        test_followup()
        
        print("=" * 60)
        print("All tests completed!")
        print("=" * 60)
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to API at", BASE_URL)
        print("Make sure the server is running: python -m uvicorn app.main:app --reload")
    except Exception as e:
        print(f"ERROR: {e}")
