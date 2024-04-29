import os
import numpy as np
import pandas as pd
import tensorflow as tf
import logging
from tensorflow import keras
from keras import regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import ModelCheckpoint, EarlyStopping
from keras.models import Model
from keras.layers import Dense, Input, GlobalAveragePooling2D, Conv2D, Activation
from keras.layers import BatchNormalization, MaxPooling2D, Dropout, concatenate
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder
from datasets import load_dataset
from tensorflow.keras import models

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

batch_size = 32
epochs = 100
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

kernel_init = keras.initializers.glorot_uniform()
bias_init = keras.initializers.Constant(value=0.2)

def inception_module(x,
                     filters_1x1,
                     filters_3x3_reduce,
                     filters_3x3,
                     filters_5x5_reduce,
                     filters_5x5,
                     filters_pool_proj):
    
    conv_1x1 = Conv2D(filters_1x1, (1, 1), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(x)
    
    conv_3x3 = Conv2D(filters_3x3_reduce, (1, 1), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(x)
    conv_3x3 = Conv2D(filters_3x3, (3, 3), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(conv_3x3)

    conv_5x5 = Conv2D(filters_5x5_reduce, (1, 1), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(x)
    conv_5x5 = Conv2D(filters_5x5, (5, 5), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(conv_5x5)

    pool_proj = MaxPooling2D((3, 3), strides=(1, 1), padding='same')(x)
    pool_proj = Conv2D(filters_pool_proj, (1, 1), padding='same', activation='relu', kernel_initializer=kernel_init, bias_initializer=bias_init)(pool_proj)

    output = concatenate([conv_1x1, conv_3x3, conv_5x5, pool_proj], axis=3)
    
    return output

weight_decay = 1e-4 # used to reduce overfitting
input_layer = Input(shape=(32, 32, 3))
x = Conv2D(32, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay), input_shape=(IMG_SIZE, IMG_SIZE, 3))(input_layer)
x = Activation('relu')(x)
x = BatchNormalization()(x)

x = Conv2D(32, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.2)(x)

x = Conv2D(64, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay), input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)

x = Conv2D(64, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.3)(x)

x = Conv2D(128, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay), input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)

x = Conv2D(128, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.5)(x)

x = Conv2D(256, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay), input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)

x = Conv2D(256, (3,3), padding='same', kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.7)(x)

x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x)
x = Dense(512, activation='relu')(x)
x = Dense(10, activation='softmax')(x)

model = Model(input_layer, x)

opt = keras.optimizers.SGD(learning_rate=0.1)
model.compile(optimizer=opt,
              loss='categorical_crossentropy', metrics=['accuracy'])

model.summary()

datagen = ImageDataGenerator(rotation_range = 20,  
        zoom_range = 0.1, 
        width_shift_range = 0.1,  
        height_shift_range = 0.1,
        shear_range = 0.1,
        horizontal_flip = True,  
        vertical_flip = False)

early_stopping = EarlyStopping(monitor='val_loss',
                               patience=10,
                               restore_best_weights=True)
filepath="saved_models/1 - cifar10/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.weights.h5" # includes epoch and validation acc.
filepathmodel="saved_models/1 - cifar10/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.keras" # includes epoch and validation acc.
checkpoint = ModelCheckpoint(filepath, verbose=1,
                             save_best_only=True,
                             mode='min')
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='loss',
                                                 factor=0.5,
                                                 patience=4,
                                                 min_lr=1e-6)
checkpoint = ModelCheckpoint(filepath,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min',
                                 save_weights_only=True)
checkpointmodel = ModelCheckpoint(filepathmodel,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min')
filename='cifar10.csv'
history_logger = tf.keras.callbacks.CSVLogger(filename, separator=",", append=True)
callbacks_list = [checkpoint, checkpointmodel, reduce_lr, tensorboard_callback, history_logger]

history = model.fit(
    datagen.flow(train_images,
                 train_captions_categorical,
                 batch_size=batch_size),
    batch_size=batch_size,
    epochs=epochs,
    verbose=1,
    validation_data=(test_images,
                     test_captions_categorical),
    shuffle=True,
    callbacks=callbacks_list
)

model.save('saved_models/1 - cifar10/accessibility_cifar10.keras')