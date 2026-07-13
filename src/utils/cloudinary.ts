const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Uploads a file (or base64 string/dataURL) to Cloudinary using unsigned upload preset.
 * Returns the secure URL of the uploaded image.
 */
export const uploadImageToCloudinary = async (fileOrDataUrl: File | string): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary configuration is missing. Returning local preview/placeholder.');
    if (typeof fileOrDataUrl === 'string') {
      return fileOrDataUrl;
    }
    return URL.createObjectURL(fileOrDataUrl);
  }

  const formData = new FormData();

  if (typeof fileOrDataUrl === 'string') {
    // If it's base64 or DataURL
    formData.append('file', fileOrDataUrl);
  } else {
    // If it's a File object from input
    formData.append('file', fileOrDataUrl);
  }

  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
