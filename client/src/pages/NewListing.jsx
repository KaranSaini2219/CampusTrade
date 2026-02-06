import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Sports', 'Clothing', 'Study Material', 'Other'];
const CONDITIONS = ['New', 'Like new', 'Used'];

export default function NewListing() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImages = (e) => {
    const fileList = e.target.files;
    
    console.log('=== FILE SELECTION DEBUG ===');
    console.log('FileList object:', fileList);
    console.log('FileList.length:', fileList?.length);
    console.log('FileList type:', typeof fileList);
    
    if (!fileList || fileList.length === 0) {
      console.log('❌ No files selected');
      return;
    }
    
    // METHOD 1: Manual iteration
    const filesArray = [];
    for (let i = 0; i < fileList.length; i++) {
      filesArray.push(fileList[i]);
      console.log(`File ${i}:`, fileList[i].name, fileList[i].size);
    }
    
    console.log('✅ Extracted files:', filesArray.length);
    
    // Limit to 5 images
    const limitedFiles = filesArray.slice(0, 5);
    
    if (filesArray.length > 5) {
      setError('Maximum 5 images allowed. Using first 5.');
    } else {
      setError('');
    }
    
    // Check file sizes
    const oversized = limitedFiles.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`${oversized.length} image(s) exceed 5MB. Please choose smaller files.`);
      return;
    }
    
    // Check file types
    const invalidTypes = limitedFiles.filter(f => !f.type.startsWith('image/'));
    if (invalidTypes.length > 0) {
      setError('Only image files are allowed.');
      return;
    }
    
    // Store files
    setImages(limitedFiles);
    
    // Generate previews
    const previews = limitedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    
    console.log('🎉 Successfully stored', limitedFiles.length, 'images');
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAllImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Images array:', images);
    console.log('Number of images:', images.length);
    
    setLoading(true);
    
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('price', Number(form.price));
    fd.append('category', form.category);
    fd.append('condition', form.condition);
    
    // Append images - using for loop to be explicit
    for (let i = 0; i < images.length; i++) {
      const imageFile = images[i];
      fd.append('images', imageFile, imageFile.name);
      console.log(`📎 Appended image ${i + 1}: ${imageFile.name} (${imageFile.size} bytes)`);
    }
    
    // Debug: Check FormData
    console.log('=== FORMDATA CONTENTS ===');
    for (let [key, value] of fd.entries()) {
      if (value instanceof File) {
        console.log(key, '→', value.name, `(${value.size} bytes)`);
      } else {
        console.log(key, '→', value);
      }
    }
    
    try {
      console.log('📤 Sending request...');
      const { data } = await api.post('/listings', fd, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      });
      
      console.log('=== SERVER RESPONSE ===');
      console.log('Response data:', data);
      console.log('Images in response:', data.images);
      console.log('Number of images saved:', data.images?.length || 0);
      
      if (data.images?.length !== images.length) {
        console.warn(`⚠️ Sent ${images.length} images but only ${data.images?.length} were saved!`);
      } else {
        console.log('✅ All images saved successfully!');
      }
      
      navigate(`/listing/${data._id}`);
    } catch (err) {
      console.error('=== ERROR ===');
      console.error('Error object:', err);
      console.error('Response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Post a New Item</h1>
      <p className="text-sm text-slate-500 mb-6">
        Only legal items allowed. Admins may remove listings.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={150}
            placeholder="e.g. MacBook Pro 2022"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            maxLength={2000}
            rows={5}
            placeholder="Describe your item in detail..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">{form.description.length}/2000</p>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            min={0}
            placeholder="Enter price"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category & Condition */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Images Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Images (1-5) <span className="text-red-500">*</span>
          </label>
          
          {/* CRITICAL: Standard file input with multiple attribute */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-900
              hover:file:bg-blue-100
              cursor-pointer border border-slate-300 rounded-lg"
          />
          
          <p className="text-xs text-slate-500 mt-2">
            💡 Hold Ctrl (Windows) or Cmd (Mac) while clicking to select multiple images
          </p>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">
                  Selected Images ({imagePreviews.length}/5)
                </p>
                <button
                  type="button"
                  onClick={removeAllImages}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove All
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-slate-200"
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Remove this image"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-900 text-white text-xs px-2 py-1 rounded font-semibold">
                        Main
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                    
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {images[index]?.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="w-full py-3 bg-yellow-500 text-slate-900 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading {images.length} image{images.length !== 1 ? 's' : ''}...
            </span>
          ) : (
            `Post Listing ${images.length > 0 ? `(${images.length} image${images.length !== 1 ? 's' : ''})` : ''}`
          )}
        </button>
        
        <p className="text-xs text-slate-500 text-center">
          By posting, you agree to our terms. Only meet on campus for safety.
        </p>
      </form>
    </div>
  );
}
