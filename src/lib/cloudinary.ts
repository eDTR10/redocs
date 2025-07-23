// Utility to upload a file to Cloudinary and return the image URL
// Usage: uploadToCloudinary(file: File): Promise<string>

export async function uploadToCloudinary(file: File, publicId?: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('api_key', apiKey);
  // Removed 'folder' to avoid double 'signatures/' in path
  formData.append('timestamp', String(Math.floor(Date.now() / 1000)));
  if (publicId) {
    formData.append('public_id', publicId);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Cloudinary upload failed');
  const data = await response.json();
  return data.secure_url;
}
