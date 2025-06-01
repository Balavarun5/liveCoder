# Write a fastapi app that has a get route that takes a string and returns the response from openai

from fastapi import FastAPI, Request
from openai import AzureOpenAI
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import base64


endpoint = "https://ai-balavarunpedapudi7961ai067873780395.cognitiveservices.azure.com/"
model_name = "gpt-4.1-nano"
deployment = "gpt-4.1-nano"

subscription_key = os.environ.get('AZURE_OPENAI_KEY')
api_version = "2024-12-01-preview"

client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root(request: Request):
    return {"message": "Hello World"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/get_screen_test_cases")
async def get_screen_test_cases(prompt: str):
    prompt_prefix = "Imagine you are a QA Engineer. You are given a \
            screen description. Generate around 3-5 test cases for the screen. \
            Ensure that the details in the requirement are covered in the test \
            cases including specific names, colors etc. Also be mindful of overflow of elements etc."
    prompt = prompt_prefix + "\n\n" + prompt + "\n\n" + "Return the test cases as sentences seperated by /n.\
                Do not include any other text like 'Here are the test cases' or 'Test cases:' in your response."
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model_name,
        max_completion_tokens=200,
    )
    print(response.choices[0].message.content)
    return {"response": response.choices[0].message.content}

@app.get("/get_react_code")
async def get_react_code(prompt: str):
    prompt_prefix = "Imagine you are a React Developer. You are given a \
            screen requirement. Generate the react code for the screen."
    prompt = prompt_prefix + "\n\n" + prompt + "\n\n" + "Return the react \
    code and nothing else."
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model_name,
        max_completion_tokens=2000,
    )
    print(response.choices[0].message.content)
    return {"response": response.choices[0].message.content}

@app.get("/evaluate_image_with_prompt")
async def evaluate_image_with_prompt(prompt: str, image_path: str):
    encoded_image = base64.b64encode(open(image_path, "rb").read()).decode("ascii")
    print("Prompt:")
    print(prompt)
    # Prepare the messages
    messages = [
        {"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_image}"}}
        ]}
    ]
    response = client.chat.completions.create(
        messages=messages,
        model=model_name,
        max_completion_tokens=2000,
    )
    print(response.choices[0].message.content)
    return {"response": response.choices[0].message.content}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)