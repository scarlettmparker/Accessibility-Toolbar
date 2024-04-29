from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from django.contrib.auth.models import User
from rest_framework import views, routers, serializers, viewsets, status
from rest_framework.response import Response
from deep_translator import GoogleTranslator
from rest_framework.permissions import AllowAny
from concurrent.futures import ThreadPoolExecutor
from wiktionaryparser import WiktionaryParser
from lingua import LanguageDetectorBuilder
from tensorflow.keras.models import load_model

import numpy as np
import unicodedata, base64, os, json, time
import cv2 as cv
import tensorflow as tf

parser = WiktionaryParser()
detector = LanguageDetectorBuilder.from_all_languages().build()
os.environ["TF_USE_LEGACY_KERAS"] = "1"

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))
    
model_loaded = True
model = load_model(os.path.join(__location__, 'assets/model.keras'))

language_file = open(os.path.join(__location__, 'assets/supported_languages.json'))
language_data = json.load(language_file)

class_file = os.path.join(__location__, 'assets/classes.txt')

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
            original_texts = [unicodedata.normalize("NFC", text) for text in
                              serializer.validated_data['original_text']]
            target_language = serializer.validated_data['target_language']

            with ThreadPoolExecutor() as executor:
                translated_texts = list(executor.map(lambda text:
                    GoogleTranslator(source='auto', target=target_language,
                    verify='false').translate(text), original_texts))

            return Response({'translated_text': translated_texts})
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

class DefinitionSerializer(serializers.Serializer):
    word = serializers.CharField(max_length=100)
    language = serializers.CharField(max_length=6)

class DefinitionView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = DefinitionSerializer(data=request.data)
        if serializer.is_valid():
            word = request.data.get('word')
            language_code = request.data.get('language')
            language_code = language_code.lower()
            if (language_code == "none"):
                language = "English"
                confidence_values = detector.\
                    compute_language_confidence_values(word)
                for confidence in confidence_values:
                    if (confidence.value > 0.2):
                        language = confidence.language.name
                    
                parser.set_default_language(str(language_code).split('.')[1])
            else:
                language = next((lang['language'] for lang in language_data
                    if lang['language_code'].lower() == language_code), None)
                
            parser.set_default_language(language)
            definitions = parser.fetch(word)
            return Response(definitions)
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

class ClassificationSerializer(serializers.Serializer):
    image = serializers.CharField(max_length=None)
    
class ClassificationView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ClassificationSerializer(data=request.data)
        if serializer.is_valid():
            if not model_loaded:
                return Response("Error, model not loaded!")
            start_time = time.time()
            image = request.data.get('image')
            encoded_data = image.split(',')[1]
            nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
            cv2_img = cv.imdecode(nparr, cv.IMREAD_COLOR)
            
            h, w, _ = cv2_img.shape
            if h < w:
                new_h = 64
                new_w = int(w * (64 / h))
            else:
                new_w = 64
                new_h = int(h * (64 / w))
            
            # resize the image while maintaining aspect ratio
            resized_img = cv.resize(cv2_img, (new_w, new_h))
            
            # crop to 64x64
            h, w, _ = resized_img.shape
            crop_start_h = (h - 64) // 2
            crop_start_w = (w - 64) // 2
            cropped_img = resized_img[crop_start_h:crop_start_h+64, crop_start_w:crop_start_w+64]
                
            prediction = model.predict(np.array([cropped_img]) / 255)
            
            # get the top 3 predictions with their confidence values
            top3_indices = np.argsort(prediction[0])[::-1][:3]
            top3_confidences = [prediction[0][i] for i in top3_indices]
            
            for i, idx in enumerate(top3_indices):
                class_line = None
                with open(class_file, 'r') as f:
                    for j, line in enumerate(f):
                        if j == idx:
                            class_line = line.strip()
                            break
            
            return Response({"top3_indices": top3_indices,
                             "top3_confidences": top3_confidences})
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('translate/', TranslationView.as_view(), name='translate'),
    path('definition/', DefinitionView.as_view(), name='definition'),
    path('classify/', ClassificationView.as_view(), name='classify'),
]