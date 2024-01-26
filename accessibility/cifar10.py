import os
import numpy as np
import keras
import tensorflow as tf
from keras import regularizers
from keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import ModelCheckpoint
from keras.callbacks import EarlyStopping
from keras.models import Sequential
from keras.layers import Dense, Flatten, Activation, Conv2D
from keras.layers import MaxPooling2D, BatchNormalization, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder
from datasets import load_dataset

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

batch_size = 32
IMG_SIZE = 32

dataset_loc = 'datasets/cifar10/plain_text/'
dataset = load_dataset("parquet", data_files=
                       {'train': dataset_loc + 'train-00000-of-00001.parquet',
                        'test': dataset_loc + '/test-00000-of-00001.parquet'})

train_images = np.array(dataset['train']['img']) # converted for training
test_images = np.array(dataset['test']['img'])

train_images = train_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0
test_images = test_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0

label_encoder = LabelEncoder() # used for one hot encoding
train_captions_encoded = label_encoder.fit_transform(dataset['train']['label'])
test_captions_encoded = label_encoder.transform(dataset['test']['label'])

train_captions_categorical = to_categorical(train_captions_encoded)
test_captions_categorical = to_categorical(test_captions_encoded)

weight_decay = 1e-4 # used to reduce overfitting
model = Sequential()
model.add(Conv2D(32, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay),
                 input_shape=(IMG_SIZE, IMG_SIZE, 3)))
model.add(Activation('elu'))
model.add(BatchNormalization()) # more overfitting prevention
model.add(Conv2D(32, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.2))
 
model.add(Conv2D(64, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(Conv2D(64, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.3))
 
model.add(Conv2D(128, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(Conv2D(128, (3,3), padding='same',
                 kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.5))

model.add(Flatten())
model.add(Dense(10, activation='softmax')) # matches number of classes in set

opt = keras.optimizers.RMSprop(lr=0.001)
model.compile(optimizer=opt,
              loss='categorical_crossentropy', metrics=['accuracy'])

model.summary()

# used to augment (modify) the images to artificially increase dataset
datagen = ImageDataGenerator(featurewise_center=False, 
    samplewise_center=False,
    featurewise_std_normalization=False,
    samplewise_std_normalization=False,
    zca_whitening=False,
    rotation_range=20,
    zoom_range = 0,
    shear_range=0,
    width_shift_range=0,
    height_shift_range=0,
    horizontal_flip=True,
    vertical_flip=False,
    validation_split=0.2
)

# callbacks to prevent data loss and training when unnecessary
early_stopping = EarlyStopping(monitor='val_loss',
                               patience=10,
                               restore_best_weights=True)
filepath = "saved_models/1 - cifar10/weights-improvement-\
    {epoch:02d}-{val_accuracy:.2f}.keras"
checkpoint = ModelCheckpoint(filepath, verbose=1,
                             save_best_only=True,
                             mode='min')
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='loss',
                                                 factor=0.5,
                                                 patience=4,
                                                 min_lr=1e-6)

callbacks_list = [checkpoint, reduce_lr]

history = model.fit(
    datagen.flow(train_images,
                 train_captions_categorical,
                 batch_size=batch_size),
    batch_size=batch_size,
    epochs=135,
    verbose=1,
    validation_data=(test_images,
                     test_captions_categorical),
    shuffle=True,
    callbacks=callbacks_list
)

model.save('saved_models/1 - cifar10/accessibility_cifar10.keras')