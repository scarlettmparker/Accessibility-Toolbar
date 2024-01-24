import cv2 as cv
import numpy as np
from tensorflow.keras import models

img = cv.imread("image.jpg")
img = cv.cvtColor(img, cv.COLOR_BGR2RGB)

model = models.load_model('saved_models/weights-improvement-101-0.88.keras')

class_names = ['plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']

prediction = model.predict(np.array([img]) / 255)
index = np.argmax(prediction)

print(class_names[index])