"""
Simple Z.AI API Test Script
Run this directly: python test_zai.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GLM_API_KEY")
print(f"🔑 API Key loaded: {API_KEY[:10]}...{API_KEY[-6:] if API_KEY else 'NOT FOUND'}")

if not API_KEY:
    print("❌ No API key found in .env file!")
    exit(1)

try:
    from zai import ZaiClient
    print("✅ zai-sdk imported successfully")
except ImportError as e:
    print(f"❌ Failed to import zai: {e}")
    print("   Run: pip install zai-sdk")
    exit(1)

print("\n🚀 Testing Z.AI API...")
print("-" * 40)

try:
    client = ZaiClient(api_key=API_KEY)
    print("✅ Client created")
    
    response = client.chat.completions.create(
        model="glm-4.7",
        messages=[
            {"role": "user", "content": "Say 'Hello, API is working!' in exactly those words."}
        ]
    )
    
    content = response.choices[0].message.content
    print(f"\n✅ SUCCESS! Response:\n{content}")
    
except Exception as e:
    print(f"\n❌ API FAILED!")
    print(f"   Error Type: {type(e).__name__}")
    print(f"   Error Message: {e}")
    print("\n🔍 Debugging tips:")
    print("   1. Check if your subscription includes API access")
    print("   2. Try logging into https://z.ai and checking your usage/limits")
    print("   3. Check if there's a different API key format needed")
