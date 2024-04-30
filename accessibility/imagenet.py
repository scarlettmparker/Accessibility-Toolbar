import os
import numpy as np
import tensorflow as tf
import logging
import time
import imageio

# tensorflow libraries
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from keras import regularizers
from keras.callbacks import ModelCheckpoint, EarlyStopping
from keras.models import Model
from keras.layers import Input, MaxPooling2D, Activation, concatenate
from keras.layers import BatchNormalization, Dropout, Dense
from keras.layers import  Conv2D, GlobalAveragePooling2D

# check if GPU is available
print(tf.config.list_physical_devices('GPU'))

# disable tensorflow warnings because they take like 10 years to display
logging.getLogger('tensorflow').disabled = True
__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# hyper parameters for training
epochs = 200
IMG_SIZE = 64
batch_size = 32

path = 'datasets/tiny-imagenet-200/'

# create a dictionary containing image IDs
def id_dictionary():
    id_dict = {}
    for i, line in enumerate(open( path + 'wnids.txt', 'r')):
        id_dict[line.replace('\n', '')] = i
    return id_dict
  
# function to create a dictionary mapping class names to IDs
def class_to_id_dict():
    id_dict = id_dictionary()
    all_classes = {}
    result = {}
    # open the file containing class names and IDs
    for i, line in enumerate(open( path + 'words.txt', 'r')):
        n_id, word = line.split('\t')[:2]
        all_classes[n_id] = word
    # create the dictionary
    for key, value in id_dict.items():
        result[value] = (key, all_classes[key])      
    return result

class_dict = class_to_id_dict()
# print out the class ID, folder and class name for each class
for class_id, (folder, class_name) in class_dict.items():
    print(f"Class ID: {class_id}, Folder: {folder}, Class Name: {class_name}")

# load the dataset
def data(id_dict):
    print('loading dataset')
    train_data, test_data = [], []
    train_labels, test_labels = [], []
    t = time.time()
    # load the training data and labels
    for key, value in id_dict.items():
        train_data += [imageio.imread( path +
            'train/{}/images/{}_{}.JPEG'.format(key,
                                                key,
                                                str(i)),
            pilmode='RGB') for i in range(500)]
        train_labels_ = np.array([[0]*200]*500)
        train_labels_[:, value] = 1
        train_labels += train_labels_.tolist()

    # load the testing data and labels
    for line in open( path + 'val/val_annotations.txt'):
        img_name, class_id = line.split('\t')[:2]
        test_data.append(imageio.imread( path +
            'val/images/{}'.format(img_name) ,pilmode='RGB'))
        test_labels_ = np.array([[0]*200])
        test_labels_[0, id_dict[class_id]] = 1
        test_labels += test_labels_.tolist()

    # print out time taken to load the dataset
    print('finished loading dataset, in {} seconds'.format(time.time() - t))
    return np.array(train_data), np.array(train_labels), np.array(test_data), np.array(test_labels)

train_data, train_labels, test_data, test_labels = data(id_dictionary())

# shuffle the training data and labels
def shuffle_data(train_data, train_labels ):
    size = len(train_data)
    train_idx = np.arange(size)
    np.random.shuffle(train_idx)

    return train_data[train_idx], train_labels[train_idx]
  
train_data, train_labels = shuffle_data(train_data, train_labels)

# define the training and testing data for evaluation later
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

# create the inception module
def inception_module(x,
                     filters_1x1,
                     filters_3x3_reduce,
                     filters_3x3,
                     filters_5x5_reduce,
                     filters_5x5,
                     filters_pool_proj):
    
    # 1x1 convolution
    conv_1x1 = Conv2D(filters_1x1, (1, 1), padding='same',
                      activation='relu',
                      kernel_initializer=kernel_init,
                      bias_initializer=bias_init)(x)
    
    # 3x3 convolution
    conv_3x3 = Conv2D(filters_3x3_reduce, (1, 1), padding='same',
                      activation='relu',
                      kernel_initializer=kernel_init,
                      bias_initializer=bias_init)(x)
    conv_3x3 = Conv2D(filters_3x3, (3, 3), padding='same',
                      activation='relu',
                      kernel_initializer=kernel_init,
                      bias_initializer=bias_init)(conv_3x3)

    # 5x5 convolution
    conv_5x5 = Conv2D(filters_5x5_reduce, (1, 1), padding='same',
                      activation='relu',
                      kernel_initializer=kernel_init,
                      bias_initializer=bias_init)(x)
    conv_5x5 = Conv2D(filters_5x5, (5, 5), padding='same',
                      activation='relu',
                      kernel_initializer=kernel_init,
                      bias_initializer=bias_init)(conv_5x5)
    
    # define the pooling projection
    pool_proj = MaxPooling2D((3, 3), strides=(1, 1), padding='same')(x)
    pool_proj = Conv2D(filters_pool_proj, (1, 1), padding='same',
                       activation='relu',
                       kernel_initializer=kernel_init,
                       bias_initializer=bias_init)(pool_proj)

    # concatente the outputs of the convolutions and pooling projection
    output = concatenate([conv_1x1, conv_3x3, conv_5x5, pool_proj], axis=3)
    
    return output

# weight decay regularization
weight_decay = 1e-4
input_layer = Input(shape=(32, 32, 3))

# first convolutional layer with elu activation and batch normalization
x = Conv2D(32, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay),
           input_shape=(IMG_SIZE, IMG_SIZE, 3))(input_layer)
x = Activation('elu')(x)
x = BatchNormalization()(x)

# section convolutional layer with relu activation and batch normalization
x = Conv2D(32, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('elu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

# apply the inception module and dropout
x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.2)(x)

# repeat the same for the next layers with different parameters
x = Conv2D(64, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay),
           input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('elu')(x)
x = BatchNormalization()(x)

x = Conv2D(64, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('elu')(x)
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

# repeat the same for the next layers with different parameters
x = Conv2D(128, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay),
           input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('elu')(x)
x = BatchNormalization()(x)

x = Conv2D(128, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('elu')(x)
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

# repeat the same for the next layers with different parameters
x = Conv2D(256, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay),
           input_shape=(IMG_SIZE, IMG_SIZE, 3))(x)
x = Activation('elu')(x)
x = BatchNormalization()(x)

x = Conv2D(256, (3,3), padding='same',
           kernel_regularizer=regularizers.l2(weight_decay))(x)
x = Activation('elu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D(pool_size=(2,2))(x)

x = inception_module(x,
                     filters_1x1=32,
                     filters_3x3_reduce=48,
                     filters_3x3=64,
                     filters_5x5_reduce=8,
                     filters_5x5=16,
                     filters_pool_proj=16)

x = Dropout(0.8)(x)

# apply global average pooling and dense layers for classification
x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='elu')(x)
x = Dense(512, activation='elu')(x)
x = Dense(200, activation='softmax')(x)

# define the model
model = Model(input_layer, x)

# compile with SGD optimizer because for some reason it's better than Adam on this model
opt = keras.optimizers.SGD(learning_rate=0.01)
model.compile(loss='categorical_crossentropy', optimizer=opt, metrics=['accuracy'])

early_stopping = EarlyStopping(monitor='val_acc',
                                   patience=10,
                                   restore_best_weights=True)

# includes epoch and validation acc.
filepath="saved_models/3 - imagenet/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.weights.h5"
filepathmodel="saved_models/3 - imagenet/weights-improvement-\
        {epoch:02d}-{val_accuracy:.2f}.keras"

# create model checkpoints so model/weights can be restored
checkpoint = ModelCheckpoint(filepath,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min',
                                 save_weights_only=True)
checkpointmodel = ModelCheckpoint(filepathmodel,
                                 verbose=1,
                                 save_best_only=True,
                                 mode='min')

# learning rate reduction my beloved
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_accuracy',
                                                     factor=0.5,
                                                     patience=9,
                                                     min_lr=1e-6)

filename='imagenet.csv'
history_logger = tf.keras.callbacks.CSVLogger(filename,
                                              separator=",",
                                              append=True)
callbacks_list = [checkpoint,
                  checkpointmodel,
                  reduce_lr]

# train the model yay!
history = model.fit(
	datagen.flow(X_train, Y_train, batch_size=batch_size),
        epochs=epochs,
	validation_data=(X_test, Y_test),
	callbacks=callbacks_list
)

# save complete model after 200 epochs
model.save('saved_models/3 - imagenet/accessibility_imagenet1k.keras')