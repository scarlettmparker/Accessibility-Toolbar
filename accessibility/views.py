from django.shortcuts import render
import json
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse

def index(request):
    return HttpResponse("everything good!")

# Create your views here.
