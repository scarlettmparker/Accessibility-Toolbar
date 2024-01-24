import os
import numpy as np
import keras
from keras import regularizers
from keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import ModelCheckpoint
from keras.callbacks import LearningRateScheduler
from keras.callbacks import EarlyStopping
from keras.models import Sequential
from keras.layers import Dense, Flatten, Activation, Conv2D, MaxPooling2D, BatchNormalization, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder
from datasets import load_dataset

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

batch_size = 64
IMG_SIZE = 32

dataset = load_dataset("parquet", data_files={'train': 'datasets/cifar10/plain_text/train-00000-of-00001.parquet',
                                              'test': 'datasets/cifar10/plain_text/test-00000-of-00001.parquet'})

train_images = np.array(dataset['train']['img'])
test_images = np.array(dataset['test']['img'])

train_images = train_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0
test_images = test_images.reshape(-1, IMG_SIZE, IMG_SIZE, 3) / 255.0

label_encoder = LabelEncoder()
train_captions_encoded = label_encoder.fit_transform(dataset['train']['label'])
test_captions_encoded = label_encoder.transform(dataset['test']['label'])

train_captions_categorical = to_categorical(train_captions_encoded)
test_captions_categorical = to_categorical(test_captions_encoded)

def lr_schedule(epoch):
    lr = 0.001
    if epoch > 75:
        lr = 0.0005
    if epoch > 100:
        lr = 0.0003
    return lr

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
model.add(Dropout(0.4))

model.add(Flatten())
model.add(Dense(10, activation='softmax'))

opt_rms = keras.optimizers.RMSprop(lr=0.001)
model.compile(optimizer=opt_rms, loss='categorical_crossentropy', metrics=['accuracy'])

model.summary()

datagen = ImageDataGenerator(rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,)

augmented_data_gen = datagen.flow(train_images, train_captions_categorical, batch_size=batch_size)

learning_rate_scheduler = LearningRateScheduler(lr_schedule)
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

filepath="saved_models/weights-improvement-{epoch:02d}-{val_accuracy:.2f}.keras" #includes epoch and validation accuracy
checkpoint = ModelCheckpoint(filepath, monitor='val_accuracy', verbose=1, save_best_only=True, mode='max')
callbacks_list = [checkpoint, learning_rate_scheduler]

train_batches = len(train_images) // batch_size
validation_batches = len(test_images) // batch_size
history = model.fit(augmented_data_gen,
                    batch_size=batch_size,
                    epochs=125,
                    steps_per_epoch=train_batches,
                    validation_data=(test_images, test_captions_categorical),
                    validation_steps=validation_batches,
                    callbacks=callbacks_list)

model.save('saved_models/1 - cifar10/accessibility_cifar10-2.keras')