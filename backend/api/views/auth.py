from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from api.serializers import LoginSerializer, RegisterSerializer, UserSerializer
from api.models import User, RegisteredID

__all__ = ['LoginView', 'VerifyIDView', 'RegisterView']


class LoginView(APIView):
    """POST /api/login – returns JWT access & refresh tokens"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(email=serializer.validated_data['email'], password=serializer.validated_data['password'])
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })



class VerifyIDView(APIView):
    """POST /api/verify-id – checks a registration ID"""
    permission_classes = [AllowAny]

    def post(self, request):
        id_number = request.data.get('id_number')
        role = request.data.get('role')
        try:
            rid = RegisteredID.objects.get(id_number=id_number, role=role, is_used=False)
            return Response({'valid': True, 'message': 'ID is available'})
        except RegisteredID.DoesNotExist:
            return Response({'valid': False, 'message': 'ID not found or already used'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    """POST /api/register – creates a new user and marks the registration ID as used"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Mark the registration ID as used
        rid = RegisteredID.objects.filter(id_number=serializer.validated_data['id_number']).first()
        if rid:
            rid.is_used = True
            rid.used_by_email = user.email
            rid.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)

