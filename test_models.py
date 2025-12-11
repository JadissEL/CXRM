import google.generativeai as genai
import os

GOOGLE_API_KEY = "AIzaSyDUCbtmDSQNL90mPVxd1130ZWjx-Lmn9eE"
genai.configure(api_key=GOOGLE_API_KEY)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
