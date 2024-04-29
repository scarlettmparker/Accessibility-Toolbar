from tensorflow.keras.models import load_model
import cv2 as cv
import os
import numpy as np

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))
model = load_model(os.path.join(__location__, 'model.keras'))
model.summary()

test_location = os.path.join(__location__, 'tiny-imagenet-200/test/images')

test_paths = []
for i in range(len(os.listdir(test_location))):
    path = f'tiny-imagenet-200/test/images/test_{i}.JPEG'
    test_paths.append(path)
    
X_test = []
for image in test_paths:
    img = cv.imread(str(image))
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    X_test.append(img)

X_test = np.array(X_test).astype("float64")
preds = model.predict(X_test, batch_size=32, verbose=1)

# Predicting
preds = model.predict(X_test, batch_size=32, verbose=1)

# Printing results
for i, pred in enumerate(preds):
    print(f"Prediction for test_{i}.JPEG:", pred)