import os
import datetime
import numpy as np
import tensorflow as tf
import logging
from tensorflow import keras
from keras import regularizers
from keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import ModelCheckpoint, EarlyStopping, LearningRateScheduler
from keras.models import Sequential
from keras.layers import Dense, Flatten, Activation, Conv2D, MaxPooling2D, BatchNormalization, Dropout, Input
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder
from datasets import load_dataset

logging.getLogger('tensorflow').disabled = True

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

batch_size = 64
IMG_SIZE = 32

dataset = load_dataset("parquet", data_files={'train': 'datasets/cifar100/cifar100/train-00000-of-00001.parquet',
                                              'test': 'datasets/cifar100/cifar100/test-00000-of-00001.parquet'})

train_images = np.array(dataset['train']['img'])
test_images = np.array(dataset['test']['img'])

train_images = train_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0
test_images = test_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0

train_captions_fine = dataset['train']['fine_label']
test_captions_fine = dataset['test']['fine_label']

train_captions_fine = [x + 10 for x in train_captions_fine]
test_captions_fine = [x + 10 for x in test_captions_fine]

label_encoder_fine = LabelEncoder()
train_captions_fine_encoded = label_encoder_fine.fit_transform(train_captions_fine)
test_captions_fine_encoded = label_encoder_fine.transform(test_captions_fine)

train_captions_fine_categorical = to_categorical(train_captions_fine_encoded, 100)
test_captions_fine_categorical = to_categorical(test_captions_fine_encoded, 100)

weight_decay = 1e-4
model = Sequential()
model.add(Conv2D(32, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay), input_shape=(IMG_SIZE, IMG_SIZE, 3)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(Conv2D(32, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.2))
 
model.add(Conv2D(64, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(Conv2D(64, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.3))
 
model.add(Conv2D(128, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(Conv2D(128, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay)))
model.add(Activation('elu'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))
model.add(Dropout(0.5))
model.add(Flatten())

#model.add(Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l1_l2(l1=1e-5, l2=1e-4),
#bias_regularizer=keras.regularizers.l2(1e-4), activity_regularizer=keras.regularizers.l2(1e-5)))
#model.add(BatchNormalization())
#model.add(Dropout(0.25))
#model.add(Dense(128,activation="relu",kernel_regularizer=keras.regularizers.l1_l2(l1=1e-5, l2=1e-4),
#bias_regularizer=keras.regularizers.l2(1e-4), activity_regularizer=keras.regularizers.l2(1e-5)))
#model.add(BatchNormalization())

model.add(Dense(100, activation='softmax'))
opt = keras.optimizers.Adam(lr=0.001)
model.compile(optimizer=opt, loss='categorical_crossentropy', metrics=['accuracy'], loss_weights=[1.0, 1.0])

model.summary()

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
        validation_split=0.2)

early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
filepath="saved_models/2 - cifar100/weights-improvement-{epoch:02d}-{val_accuracy:.2f}.keras" # includes epoch and validation accuracy
checkpoint = ModelCheckpoint(filepath, verbose=1, save_best_only=True, mode='min')
logdir = os.path.join("saved_models/2 - cifar100/logs_cifar_100", datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
tensorboard_callback = tf.keras.callbacks.TensorBoard(logdir, histogram_freq=1)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='loss', factor=0.5, patience=4, min_lr=1e-6)

callbacks_list = [checkpoint, reduce_lr, tensorboard_callback]

train_batches = len(train_images) // batch_size
validation_batches = len(test_images) // batch_size

history = model.fit(
    datagen.flow(train_images, train_captions_fine_categorical, batch_size=batch_size),
    batch_size=batch_size,
    epochs=350,
    verbose=1,
    validation_data=(test_images, test_captions_fine_categorical),
    shuffle=True,
    callbacks=callbacks_list
)

model.save('saved_models/2 - cifar100/accessibility_cifar100.keras')