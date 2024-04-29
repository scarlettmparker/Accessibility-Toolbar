import os
import datetime
import numpy as np
import tensorflow as tf
import logging
from tensorflow import keras
from keras import regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import ModelCheckpoint, EarlyStopping
from keras.models import Sequential, Model
from keras.layers import Input, MaxPooling2D, Activation, concatenate, Dense, Flatten, AveragePooling2D
from keras.layers import BatchNormalization, Dropout, Conv2D, ELU, GlobalAveragePooling2D, ReLU, DepthwiseConv2D
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from datasets import load_dataset
from tensorflow.keras import models
from keras.layers import Add
import tensorflow.keras.backend as K
import tensorflow_datasets as tfds
import cv2 as cv
import sklearn, io
import pandas as pd
import time
import imageio


print(tf.config.list_physical_devices('GPU'))

logging.getLogger('tensorflow').disabled = True # ignore warnings
__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

epochs = 100
IMG_SIZE = 64
batch_size = 32

path = 'datasets/tiny-imagenet-200/'

def id_dictionary():
    id_dict = {}
    for i, line in enumerate(open( path + 'wnids.txt', 'r')):
        id_dict[line.replace('\n', '')] = i
    return id_dict
  
def class_to_id_dict():
    id_dict = id_dictionary()
    all_classes = {}
    result = {}
    for i, line in enumerate(open( path + 'words.txt', 'r')):
        n_id, word = line.split('\t')[:2]
        all_classes[n_id] = word
    for key, value in id_dict.items():
        result[value] = (key, all_classes[key])      
    return result

class_dict = class_to_id_dict()
for class_id, (folder, class_name) in class_dict.items():
    print(f"Class ID: {class_id}, Folder: {folder}, Class Name: {class_name}")

def data(id_dict):
    print('loading dataset')
    train_data, test_data = [], []
    train_labels, test_labels = [], []
    t = time.time()
    for key, value in id_dict.items():
        train_data += [imageio.imread( path + 'train/{}/images/{}_{}.JPEG'.format(key, key, str(i)), pilmode='RGB') for i in range(500)]
        train_labels_ = np.array([[0]*200]*500)
        train_labels_[:, value] = 1
        train_labels += train_labels_.tolist()

    for line in open( path + 'val/val_annotations.txt'):
        img_name, class_id = line.split('\t')[:2]
        test_data.append(imageio.imread( path + 'val/images/{}'.format(img_name) ,pilmode='RGB'))
        test_labels_ = np.array([[0]*200])
        test_labels_[0, id_dict[class_id]] = 1
        test_labels += test_labels_.tolist()

    print('finished loading dataset, in {} seconds'.format(time.time() - t))
    return np.array(train_data), np.array(train_labels), np.array(test_data), np.array(test_labels)

train_data, train_labels, test_data, test_labels = data(id_dictionary())

def shuffle_data(train_data, train_labels ):
    size = len(train_data)
    train_idx = np.arange(size)
    np.random.shuffle(train_idx)

    return train_data[train_idx], train_labels[train_idx]
  
train_data, train_labels = shuffle_data(train_data, train_labels)

X_train = train_data
Y_train = train_labels
X_test = test_data
Y_test = test_labels

X_train = X_train.astype('float32')
X_test = X_test.astype('float32')

# subtract mean and normalize
mean_image = np.mean(X_train, axis=0)
X_train -= mean_image
X_test -= mean_image
X_train /= 128.
X_test /= 128.

datagen = ImageDataGenerator(
          featurewise_center=False,           # set input mean to 0 over the dataset
          samplewise_center=False,            # set each sample mean to 0
          featurewise_std_normalization=False,# divide inputs by std of the dataset
          samplewise_std_normalization=False, # divide each input by its std
          zca_whitening=False,                # apply ZCA whitening
          rotation_range=0,                   # randomly rotate images in the range (degrees, 0 to 180)
          width_shift_range=0.1,              # randomly shift images horizontally (fraction of total width)
          height_shift_range=0.1,             # randomly shift images vertically (fraction of total height)
          horizontal_flip=True,               # randomly flip images
          vertical_flip=False )               # randomly flip images

datagen.fit(X_train)

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
input_layer = Input(shape=(IMG_SIZE, IMG_SIZE, 3))
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

x = Dropout(0.4)(x)

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

x = Dropout(0.6)(x)

x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x)
x = Dense(512, activation='relu')(x)
x = Dense(200, activation='softmax')(x)

model = Model(input_layer, x)

opt = keras.optimizers.SGD(learning_rate=0.01)
model.compile(loss='categorical_crossentropy', optimizer=opt, metrics=['accuracy'])

early_stopping = EarlyStopping(monitor='val_acc',
                                   patience=10,
                                   restore_best_weights=True)
filepath="saved_models/3 - imagenet/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.weights.h5" # includes epoch and validation acc.
filepathmodel="saved_models/3 - imagenet/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.keras" # includes epoch and validation acc.
checkpoint = ModelCheckpoint(filepath,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min',
                                 save_weights_only=True)
checkpointmodel = ModelCheckpoint(filepathmodel,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min')
logdir = os.path.join("saved_models/3 - imagenet/logs_imagenet1k",
                          datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
tensorboard_callback = tf.keras.callbacks.TensorBoard(logdir,
                                                          histogram_freq=1)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_accuracy',
                                                     factor=0.5,
                                                     patience=9,
                                                     min_lr=1e-6)

filename='imagenet.csv'
history_logger = tf.keras.callbacks.CSVLogger(filename, separator=",", append=True)
callbacks_list = [checkpoint, checkpointmodel, reduce_lr, tensorboard_callback, history_logger]


history = model.fit(
	datagen.flow(X_train, Y_train, batch_size=batch_size),
        epochs=epochs,
	validation_data=(X_test, Y_test),
	callbacks=callbacks_list
)

model.save('saved_models/3 - imagenet/accessibility_imagenet1k.keras')