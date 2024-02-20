from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from django.contrib.auth.models import User
from django.db import models
from rest_framework import views, routers, serializers, viewsets, status
from rest_framework.response import Response
from deep_translator import GoogleTranslator
from rest_framework.permissions import AllowAny
from concurrent.futures import ThreadPoolExecutor
import unicodedata

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'is_staff']

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
class TranslationSerializer(serializers.Serializer):
    original_text = serializers.ListField(child=serializers.CharField())
    target_language = serializers.CharField(max_length=10)

class TranslationView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = TranslationSerializer(data=request.data)
        if serializer.is_valid():
            original_texts = [unicodedata.normalize("NFC", text) for text in serializer.validated_data['original_text']]
            target_language = serializer.validated_data['target_language']

            with ThreadPoolExecutor() as executor:
                translated_texts = list(executor.map(lambda text: GoogleTranslator(source='auto', target=target_language).translate(text), original_texts))

            return Response({'translated_text': translated_texts})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('translate/', TranslationView.as_view(), name='translate'),
]