import numpy as np
import unicodedata, base64, os, json
import cv2 as cv

# djago related libraries
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

# initialise wiktionary parser and language detector
parser = WiktionaryParser()
detector = LanguageDetectorBuilder.from_all_languages().build()

# dunno if this is even required but i left it in there
os.environ["TF_USE_LEGACY_KERAS"] = "1"

# get real path of current files directory
__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))
    
model_loaded = True
model = load_model(os.path.join(__location__, 'assets/model.keras'))

# load supported languages from the JSON
language_file = open(os.path.join(__location__,
                                  'assets/supported_languages.json'))
language_data = json.load(language_file)

# get the path of the classes file
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
    
    # post for translatio view
    def post(self, request):
        serializer = TranslationSerializer(data=request.data)
        if serializer.is_valid():
            original_texts = [
                unicodedata.normalize("NFC", text) for text in
                serializer.validated_data['original_text']
            ]
            target_language = serializer.validated_data['target_language']
            
            # filter out any accidentally long texts (usually from code)
            filtered_texts = [text for text in
                              original_texts if len(text) <= 4950]

            # translate texts concurrently
            with ThreadPoolExecutor() as executor:
                translated_texts = list(executor.map(
                    lambda text: GoogleTranslator(
                        source='auto', target=target_language,
                        verify='false'
                    ).translate(text), filtered_texts
                ))

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
            # get the request data to define
            word = request.data.get('word')
            language_code = request.data.get('language')
            # make it lower because formatting
            language_code = language_code.lower()
            if (language_code == "none"):
                # default to english as it has richest wiktionary pages
                language = "English"
                confidence_values = detector.\
                    compute_language_confidence_values(word)
                for confidence in confidence_values:
                    # if the confience is high enough set the language
                    if (confidence.value > 0.2):
                        language = confidence.language.name
                parser.set_default_language(language)
            else:
                # map the language to the correct code
                language = next((lang['language'] for lang in language_data
                    if lang['language_code'].lower() == language_code), None)
                
            parser.set_default_language(language)
            definitions = parser.fetch(word)
            
            # contain language for TTS stuff
            response_data = {
                "definitions": definitions,
                "language": language
            }
            
            return Response(response_data)
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)
                            
class LanguageDetectSerializer(serializers.Serializer):
    text = serializers.CharField()
    
class LanguageDetectView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LanguageDetectSerializer(data=request.data)
        if serializer.is_valid():
            text = request.data.get('text')
            language = "English"
            confidence_values = detector.\
                compute_language_confidence_values(text)
            for confidence in confidence_values:
                if (confidence.value > 0.2):
                    language = confidence.language.name
            return Response(language)

class ClassificationSerializer(serializers.Serializer):
    image = serializers.CharField(max_length=None)
    
class ClassificationView(views.APIView):
    permission_classes = [AllowAny]
    
    # post method stuff
    def post(self, request):
        serializer = ClassificationSerializer(data=request.data)
        if serializer.is_valid():
            # if the model somehow doesn't load
            if not model_loaded:
                return Response("Error, model not loaded!")
            # get image from the page and decode it
            image = request.data.get('image')
            encoded_data = image.split(',')[1]
            
            # convert back to image from base 64
            nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
            cv2_img = cv.imdecode(nparr, cv.IMREAD_COLOR)
            
            # get the dimensions and resize the smallest
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
            cropped_img = resized_img[crop_start_h:crop_start_h+64,
                                      crop_start_w:crop_start_w+64]
                
            prediction = model.predict(np.array([cropped_img]) / 255)
            
            # get the top 3 predictions with their confidence values
            top3_indices = np.argsort(prediction[0])[::-1][:3]
            top3_confidences = [round(prediction[0][i] * 100, 1)
                                for i in top3_indices]
            
            top3_classes = []
            
            # find corresponding text classes from the classes file
            with open(class_file, 'r') as f:
                classes = f.readlines()
                for idx in top3_indices:
                    top3_classes.append(classes[idx].strip())
            
            return Response({"top3_classes": top3_classes,
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
    path('detectlang/', LanguageDetectView.as_view(), name='detectlang'),
]