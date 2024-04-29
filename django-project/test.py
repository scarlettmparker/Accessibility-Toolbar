
from wiktionaryparser import WiktionaryParser

import pathlib

import numpy as np
import unicodedata, base64, io, os, json, keras, time
import tensorflow as tf
from tensorflow.keras import models

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))
model = models.load_model(os.path.join(__location__, 'assets/model.keras'))
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
open("converted_model.tflite", "wb").write(tflite_model)