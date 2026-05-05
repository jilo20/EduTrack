import json
import urllib.request
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.chatbot_prompts import get_chatbot_system_prompt


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])

        # ── Dynamically inject the system prompt ──────────────
        system_prompt = get_chatbot_system_prompt(request.user)
        ai_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]

        # ── Read API key ──────────────────────────────────────
        api_key = os.environ.get('AI_API_KEY')
        if not api_key:
            try:
                with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'api.txt'), 'r') as f:
                    api_key = f.read().strip()
            except Exception:
                pass

        if not api_key:
            return Response({"error": "API key not configured on server"}, status=500)

        # ── Call the AI API ───────────────────────────────────
        url = "https://shapeshadows.tech/ai/v1/chat/completions"
        data = json.dumps({
            "model": "ai-chat",
            "messages": ai_messages
        }).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

        try:
            with urllib.request.urlopen(req) as response:
                ai_response = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print("Shapeshadows API Error:", error_body)
            return Response({"error": f"HTTP Error {e.code}: {error_body}"}, status=500)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

        # Return the final message to the frontend
        response_message = ai_response.get("choices", [{}])[0].get("message", {})
        return Response(response_message)
