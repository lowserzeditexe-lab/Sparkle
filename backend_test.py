#!/usr/bin/env python3
"""
Backend API Testing for Sparkle/AutoQuest Landing Page
Tests all backend endpoints with detailed validation
"""

import requests
import sys
import os
from pathlib import Path

# Load backend URL from frontend .env
frontend_env = Path("/app/frontend/.env")
BACKEND_URL = None
if frontend_env.exists():
    for line in frontend_env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip()
            break

if not BACKEND_URL:
    print("❌ ERROR: Could not find REACT_APP_BACKEND_URL in /app/frontend/.env")
    sys.exit(1)

BASE_URL = f"{BACKEND_URL}/api"
print(f"🔍 Testing backend at: {BASE_URL}\n")

# Test results tracking
tests_passed = 0
tests_failed = 0
test_details = []


def test_result(name, passed, details=""):
    """Track test results"""
    global tests_passed, tests_failed
    if passed:
        tests_passed += 1
        status = "✅ PASS"
    else:
        tests_failed += 1
        status = "❌ FAIL"
    
    result = f"{status}: {name}"
    if details:
        result += f"\n   {details}"
    test_details.append(result)
    print(result)


def test_info_endpoint():
    """Test GET /api/info endpoint"""
    print("\n" + "="*60)
    print("TEST 1: GET /api/info")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/info", timeout=10)
        
        # Check status code
        if response.status_code != 200:
            test_result("GET /api/info status code", False, 
                       f"Expected 200, got {response.status_code}")
            return
        
        test_result("GET /api/info status code", True, "200 OK")
        
        # Check JSON response
        try:
            data = response.json()
        except Exception as e:
            test_result("GET /api/info JSON parsing", False, str(e))
            return
        
        test_result("GET /api/info JSON parsing", True)
        
        # Validate required fields
        required_fields = ["extension", "plugin", "steps", "platform"]
        for field in required_fields:
            if field not in data:
                test_result(f"GET /api/info field '{field}'", False, "Missing from response")
            else:
                test_result(f"GET /api/info field '{field}'", True)
        
        # Validate plugin metadata
        if "plugin" in data:
            plugin = data["plugin"]
            if plugin.get("name") == "AutoQuest":
                test_result("GET /api/info plugin.name", True, "AutoQuest")
            else:
                test_result("GET /api/info plugin.name", False, 
                           f"Expected 'AutoQuest', got '{plugin.get('name')}'")
            
            # Check for author, version, description
            for field in ["author", "version", "description"]:
                if field in plugin:
                    test_result(f"GET /api/info plugin.{field}", True, 
                               f"'{plugin[field][:50]}...' " if len(str(plugin[field])) > 50 else f"'{plugin[field]}'")
        
        print(f"\n📄 Full response: {data}")
        
    except requests.exceptions.RequestException as e:
        test_result("GET /api/info", False, f"Request failed: {str(e)}")
    except Exception as e:
        test_result("GET /api/info", False, f"Unexpected error: {str(e)}")


def test_plugin_download():
    """Test GET /api/plugin/download endpoint"""
    print("\n" + "="*60)
    print("TEST 2: GET /api/plugin/download")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/plugin/download", timeout=10)
        
        # Check status code
        if response.status_code != 200:
            test_result("GET /api/plugin/download status code", False, 
                       f"Expected 200, got {response.status_code}")
            return
        
        test_result("GET /api/plugin/download status code", True, "200 OK")
        
        # Check Content-Type header
        content_type = response.headers.get("content-type", "")
        if "application/javascript" in content_type:
            test_result("GET /api/plugin/download content-type", True, content_type)
        else:
            test_result("GET /api/plugin/download content-type", False, 
                       f"Expected 'application/javascript', got '{content_type}'")
        
        # Check Content-Disposition header
        content_disp = response.headers.get("content-disposition", "")
        if 'filename="AutoQuest.plugin.js"' in content_disp:
            test_result("GET /api/plugin/download content-disposition", True, content_disp)
        else:
            test_result("GET /api/plugin/download content-disposition", False, 
                       f"Expected filename='AutoQuest.plugin.js', got '{content_disp}'")
        
        # Check body is non-empty
        body = response.content
        if len(body) > 0:
            test_result("GET /api/plugin/download body non-empty", True, 
                       f"Size: {len(body)} bytes (~{len(body)//1024}KB)")
        else:
            test_result("GET /api/plugin/download body non-empty", False, "Body is empty")
            return
        
        # Check body starts with plugin header comment (@name AutoQuest)
        try:
            body_text = body.decode('utf-8', errors='ignore')[:2000]
            if "@name AutoQuest" in body_text or "@name" in body_text:
                test_result("GET /api/plugin/download body starts with plugin header", True, 
                           "Found @name in first 2000 chars")
                # Show first few lines
                lines = body_text.split('\n')[:5]
                print(f"   First lines of plugin:\n   " + "\n   ".join(lines))
            else:
                test_result("GET /api/plugin/download body starts with plugin header", False, 
                           "Could not find @name AutoQuest in first 2000 chars")
        except Exception as e:
            test_result("GET /api/plugin/download body validation", False, str(e))
        
    except requests.exceptions.RequestException as e:
        test_result("GET /api/plugin/download", False, f"Request failed: {str(e)}")
    except Exception as e:
        test_result("GET /api/plugin/download", False, f"Unexpected error: {str(e)}")


def test_installer_download():
    """Test GET /api/installer/download?autoquest=true endpoint"""
    print("\n" + "="*60)
    print("TEST 3: GET /api/installer/download?autoquest=true")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/installer/download?autoquest=true", 
                               timeout=10, stream=True)
        
        # Check status code
        if response.status_code != 200:
            test_result("GET /api/installer/download status code", False, 
                       f"Expected 200, got {response.status_code}")
            return
        
        test_result("GET /api/installer/download status code", True, "200 OK")
        
        # Check Content-Disposition header for filename
        content_disp = response.headers.get("content-disposition", "")
        if 'filename="Sparkle.exe"' in content_disp:
            test_result("GET /api/installer/download content-disposition", True, 
                       f"Filename: Sparkle.exe")
        else:
            test_result("GET /api/installer/download content-disposition", False, 
                       f"Expected filename='Sparkle.exe', got '{content_disp}'")
        
        # Check Content-Type
        content_type = response.headers.get("content-type", "")
        test_result("GET /api/installer/download content-type", True, content_type)
        
        # Check body size (should be large for an exe)
        # We'll just read the first chunk to verify it's not empty
        chunk = next(response.iter_content(chunk_size=1024), None)
        if chunk and len(chunk) > 0:
            test_result("GET /api/installer/download body non-empty", True, 
                       "Installer file is being served")
        else:
            test_result("GET /api/installer/download body non-empty", False, 
                       "No content received")
        
    except requests.exceptions.RequestException as e:
        test_result("GET /api/installer/download", False, f"Request failed: {str(e)}")
    except Exception as e:
        test_result("GET /api/installer/download", False, f"Unexpected error: {str(e)}")


def test_stats_increment():
    """Test GET /api/stats and verify download counter increments"""
    print("\n" + "="*60)
    print("TEST 4: GET /api/stats (download counter)")
    print("="*60)
    
    try:
        # Get initial count
        response1 = requests.get(f"{BASE_URL}/stats", timeout=10)
        if response1.status_code != 200:
            test_result("GET /api/stats status code", False, 
                       f"Expected 200, got {response1.status_code}")
            return
        
        test_result("GET /api/stats status code", True, "200 OK")
        
        try:
            data1 = response1.json()
        except Exception as e:
            test_result("GET /api/stats JSON parsing", False, str(e))
            return
        
        if "downloads" not in data1:
            test_result("GET /api/stats 'downloads' field", False, "Missing from response")
            return
        
        initial_count = data1["downloads"]
        test_result("GET /api/stats 'downloads' field", True, f"Initial count: {initial_count}")
        
        # Trigger a download
        print("\n   📥 Triggering download via /api/plugin/download...")
        download_response = requests.get(f"{BASE_URL}/plugin/download", timeout=10)
        if download_response.status_code != 200:
            test_result("Download trigger", False, 
                       f"Plugin download failed with status {download_response.status_code}")
            return
        
        test_result("Download trigger", True, "Plugin download successful")
        
        # Get count after download
        response2 = requests.get(f"{BASE_URL}/stats", timeout=10)
        if response2.status_code != 200:
            test_result("GET /api/stats after download", False, 
                       f"Expected 200, got {response2.status_code}")
            return
        
        try:
            data2 = response2.json()
        except Exception as e:
            test_result("GET /api/stats after download JSON parsing", False, str(e))
            return
        
        final_count = data2.get("downloads", 0)
        
        # Verify increment
        if final_count > initial_count:
            test_result("GET /api/stats counter increment", True, 
                       f"Count increased from {initial_count} to {final_count}")
        else:
            test_result("GET /api/stats counter increment", False, 
                       f"Count did not increase (before: {initial_count}, after: {final_count})")
        
    except requests.exceptions.RequestException as e:
        test_result("GET /api/stats", False, f"Request failed: {str(e)}")
    except Exception as e:
        test_result("GET /api/stats", False, f"Unexpected error: {str(e)}")


def main():
    """Run all tests"""
    print("🚀 Starting Backend API Tests for Sparkle/AutoQuest")
    print("="*60)
    
    # Run all tests
    test_info_endpoint()
    test_plugin_download()
    test_installer_download()
    test_stats_increment()
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"📈 Total:  {tests_passed + tests_failed}")
    
    if tests_failed > 0:
        print("\n❌ SOME TESTS FAILED")
        sys.exit(1)
    else:
        print("\n✅ ALL TESTS PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
