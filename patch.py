import os
path = 'e:/Projects/GenAi-Capstone-Project/backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_classes = '''
class KeyPointsRequest(BaseModel):
    project_id: int
    text: Optional[str] = None
    filenames: Optional[List[str]] = None

class KeyPointsResponse(BaseModel):
    markdown_content: str

@app.post("/tools/keypoints", response_model=KeyPointsResponse)
def extract_key_points(req: KeyPointsRequest, db: Session = Depends(get_db)):
    get_project_or_404(req.project_id, db)
    
    context_text = req.text
    if not context_text and req.filenames:
        context_text = ""
        for fn in req.filenames:
            docs = db.query(Document).filter_by(project_id=req.project_id, filename=fn).all()
            for doc in docs:
                context_text += f"\\n\\n--- {doc.filename} ---\\n{doc.content}"
                
    if not context_text or not context_text.strip():
        raise HTTPException(status_code=400, detail="No content provided to extract key points from.")
        
    prompt = (
        "You are an expert analytical assistant. Your task is to extract the most critical key points from the provided text.\\n"
        "Output the result STRICTLY in beautifully formatted Markdown.\\n"
        "Use properly nested hierarchies: Main Headings (##), Subheadings (###), unordered bullets (-), and sub-bullets.\\n"
        "Ensure the output is highly readable, professional, and visually structured.\\n\\n"
        f"TEXT TO ANALYZE:\\n{context_text[:12000]}"
    )
    
    try:
        response = llm_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return KeyPointsResponse(markdown_content=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''

if 'KeyPointsRequest' not in content:
    content = content.replace('class CompareRequest', new_classes + '\\nclass CompareRequest')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Backend patched successfully.')
else:
    print('Already patched.')
