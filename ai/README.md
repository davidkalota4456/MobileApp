# AI Module

This folder contains scripts for data preparation, model training, and visualization used for a skin type classification AI project.

It shows my skills with TensorFlow, data augmentation, and building AI pipelines.


import zipfile
import os
import shutil
import random

# Define the path for the new zip file
zip_file_path = 'sample_data/data1.zip'
extraction_path = 'sample_data/extracted_data2'

# Extract the data1.zip file if not already extracted
with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
    zip_ref.extractall(extraction_path)

# Define the source path for the images in data1.zip
source_path = os.path.join(extraction_path, 'Oily-DrySkin-Types')

# Check if the source path exists
if os.path.exists(source_path):
    print("I got here")
else:
    print("The specified path does not exist:", source_path)

# Now you can access and manipulate the files from `data1.zip` similarly.
# For example, if you want to print the contents:
for root, dirs, files in os.walk(source_path):
    print(f"Directory: {root}")
    for file in files[:5]:  # Display only the first 5 files
        print(f" - {file}")




--------------------------------------------------------------------------------------

import os
import shutil
import random

# Define the source path where the images are currently located
source_path = 'sample_data/extracted_data2/SkinDatasets/datasets/train/Wrinkled'

# Define the destination paths
train_destination = 'sample_data/extracted_data2/Oily-DrySkinTypes/train/wrinkled'
test_destination = 'sample_data/extracted_data2/Oily-DrySkinTypes/test/wrinkled'
valid_destination = 'sample_data/extracted_data2/Oily-DrySkinTypes/valid/wrinkled'

# Ensure destination directories exist
os.makedirs(train_destination, exist_ok=True)
os.makedirs(test_destination, exist_ok=True)
os.makedirs(valid_destination, exist_ok=True)

# Get the list of all images
all_images = os.listdir(source_path)
random.shuffle(all_images)  # Shuffle to randomize the selection

# Divide the images into 3 groups: 167 for train, 57 for test, 57 for valid
train_images = all_images[:167]
test_images = all_images[167:167 + 57]
valid_images = all_images[167 + 57:167 + 57 + 57]

# Move the train images
for image in train_images:
    shutil.move(os.path.join(source_path, image), os.path.join(train_destination, image))

# Move the test images
for image in test_images:
    shutil.move(os.path.join(source_path, image), os.path.join(test_destination, image))

# Move the valid images
for image in valid_images:
    shutil.move(os.path.join(source_path, image), os.path.join(valid_destination, image))

print(f"Moved {len(train_images)} images to {train_destination}")
print(f"Moved {len(test_images)} images to {test_destination}")
print(f"Moved {len(valid_images)} images to {valid_destination}")




-----------------------------------------------------------------------------------------------


import tensorflow as tf
import keras
import numpy as np
import pandas as pd
#from keras import ImageDataGenerator
from tensorflow.keras.preprocessing.image import ImageDataGenerator
#from tensorflow.keras.preprocessing.image import ImageDataGenerator
#from keras.preprocessing.image import ImageDataGenerator

# Define paths
train_dir = 'sample_data/extracted_data/Oily-Dry-Skin-Types/train'  # Change to your train directory
test_dir = 'sample_data/extracted_data/Oily-Dry-Skin-Types/test'     # Change to your test directory
valid_dir = 'sample_data/extracted_data/Oily-Dry-Skin-Types/valid'

# Define image parameters
image_size = (150, 150)  # Resize images to 150x150
batch_size = 32           # Number of images per batch

# Create ImageDataGenerator for training data with augmentation
train_datagen = ImageDataGenerator(
    rescale=1.0/255.0,         # Normalize pixel values to [0, 1]
    rotation_range=20,         # Randomly rotate images
    width_shift_range=0.2,     # Randomly shift images horizontally
    height_shift_range=0.2,    # Randomly shift images vertically
    shear_range=0.2,           # Shear transformation
    zoom_range=0.2,            # Random zoom
    horizontal_flip=True,      # Randomly flip images
    fill_mode='nearest'        # Fill in new pixels
)

# Create ImageDataGenerator for validation data (no augmentation)
test_datagen = ImageDataGenerator(rescale=1.0/255.0)

# Load images from the directories
train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=image_size,
    batch_size=batch_size,
    class_mode='categorical'   # Use categorical for multiple classes
)

validation_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=image_size,
    batch_size=batch_size,
    class_mode='categorical'   # Use categorical for multiple classes
)
valid_generator = test_datagen.flow_from_directory(
    valid_dir,
    target_size=image_size,
    batch_size=batch_size,
    class_mode='categorical'   # Use categorical for multiple classes
)
print('done')









------------------------------------------------------------------------------------------


import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input

# Build the CNN model
model = Sequential()

# Input layer
model.add(Input(shape=(150, 150, 3)))  # Specify input shape here

# Convolutional layer + Pooling layer
model.add(Conv2D(32, (3, 3), activation='relu'))  # 32 filters, 3x3 kernel
model.add(MaxPooling2D(pool_size=(2, 2)))         # Max pooling

model.add(Conv2D(64, (3, 3), activation='relu'))   # Second convolutional layer
model.add(MaxPooling2D(pool_size=(2, 2)))

model.add(Conv2D(128, (3, 3), activation='relu'))  # Third convolutional layer
model.add(MaxPooling2D(pool_size=(2, 2)))

model.add(Flatten())                                # Flatten the output
model.add(Dense(128, activation='relu'))           # Fully connected layer
model.add(Dropout(0.5))                            # Dropout layer to prevent overfitting
model.add(Dense(5, activation='softmax'))          # Output layer for multi-class classification

# Compile the model
model.compile(optimizer='adam',
              loss='categorical_crossentropy',      # Use categorical crossentropy for multi-class
              metrics=['accuracy'])





------------------------------------------------------------------------------------------------------
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input
from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array






# Train the model
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // batch_size,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // batch_size,
    epochs=10  # Number of epochs, you can increase this based on your dataset size
)

model.save('my_model.h5')




# Evaluate the model
loss, accuracy = model.evaluate(validation_generator)
print(f"Validation Loss: {loss:.4f}, Validation Accuracy: {accuracy:.4f}")






------------------------------------------------------------------------------------------------------






import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Load your trained model
model = load_model('my_model.h5')  # Load the model you saved earlier

# Load and preprocess a single image for prediction
def load_and_preprocess_image(img_path):
    img = load_img(img_path, target_size=(150, 150))  # Make sure the size matches your training size
    img_array = img_to_array(img)                      # Convert to array
    img_array = np.expand_dims(img_array, axis=0)     # Add batch dimension
    img_array /= 255.0                                 # Normalize to [0, 1]
    return img_array

# Path to the single image
img_path = 'sample_data/test_image/FC1.webp'  # Path to your image

# Load and preprocess the image
img_array = load_and_preprocess_image(img_path)

# Predict class for the image
predictions = model.predict(img_array)
predicted_class = np.argmax(predictions)  # Get the class with the highest probability

# Map class index to class name
class_indices = train_generator.class_indices
class_labels = list(class_indices.keys())
predicted_label = class_labels[predicted_class]

# Print the result
print(f'The predicted label for the image is: {predicted_label}')




---------------------------------------------------------------------------------------------------------


import numpy as np
import os
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Set your image size (should match the training image size)
image_size = (150, 150)  # Adjust this to your training image size

# Load and preprocess a new image
def load_and_preprocess_image(img_path):
    img = load_img(img_path, target_size=image_size)  # Load image
    img_array = img_to_array(img)                      # Convert to array
    img_array = np.expand_dims(img_array, axis=0)     # Add batch dimension
    img_array /= 255.0                                 # Normalize to [0, 1]
    return img_array

# Function to predict classes for images in a directory
def predict_images_in_directory(directory_path):
    # Map class index to class name
    class_indices = train_generator.class_indices
    class_labels = list(class_indices.keys())

    # Iterate through images in the directory
    for filename in os.listdir(directory_path):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):  # Check for image files
            img_path = os.path.join(directory_path, filename)  # Get full image path
            img_array = load_and_preprocess_image(img_path)     # Load and preprocess image
            predictions = model.predict(img_array)              # Make prediction

            # Get the index of the predicted class
            predicted_class = np.argmax(predictions)  # Class with the highest probability

            # Map the predicted class index to a label
            predicted_label = class_labels[predicted_class]

            # Print the result
            print(f'Image: {filename}, Predicted Label: {predicted_label}')

# Set the path to your test images folder
test_directory = 'sample_data/extracted_data/Oily-Dry-Skin-Types/test/wrinkled'  # Adjust this path as needed
predict_images_in_directory(test_directory)















