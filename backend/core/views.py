# backend/core/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from . import steg_logic # Imports from our logic file
import io

class EncodeAPIView(APIView):
    def post(self, request, *args, **kwargs):
        cover_image = request.FILES.get('cover_image')
        mode = request.data.get('mode')

        if not cover_image or not mode:
            return Response({"error": "Missing required fields (cover_image, mode)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            secret_data = ""
            if mode == 'normal':
                message = request.data.get('message')
                if not message:
                    return Response({"error": "Message is required for normal mode."}, status=status.HTTP_400_BAD_REQUEST)
                secret_data = message
            elif mode == 'integrity':
                target_file = request.FILES.get('target_file')
                if not target_file:
                    return Response({"error": "Target file is required for integrity mode."}, status=status.HTTP_400_BAD_REQUEST)
                file_hash = steg_logic.generate_file_hash(target_file)
                secret_data = f"HASH:{file_hash}"
            else:
                return Response({"error": "Invalid mode specified."}, status=status.HTTP_400_BAD_REQUEST)

            encoded_image = steg_logic.encode_image(cover_image, secret_data)

            buffer = io.BytesIO()
            encoded_image.save(buffer, format='PNG')
            buffer.seek(0)
            
            return HttpResponse(buffer, content_type='image/png')

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"An unexpected error occurred: {e}") # For server-side logging
            return Response({"error": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DecodeAPIView(APIView):
    def post(self, request, *args, **kwargs):
        stego_image = request.FILES.get('stego_image')
        if not stego_image:
            return Response({"error": "Stego image is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_data = steg_logic.decode_image(stego_image)
            return Response(decoded_data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"An unexpected error occurred: {e}") # For server-side logging
            return Response({"error": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)