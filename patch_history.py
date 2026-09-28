import os
path = 'e:/Projects/GenAi-Capstone-Project/backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_history = '''    # Build chat history from DB
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == request.session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )'''

new_history = '''    # Build chat history from DB (limit to last 6 messages to prevent 413 context window errors)
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == request.session_id)
        .order_by(models.ChatMessage.created_at.desc())
        .limit(6)
        .all()
    )
    history_rows.reverse() # Restore chronological order'''

content = content.replace(old_history, new_history)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched chat history')
