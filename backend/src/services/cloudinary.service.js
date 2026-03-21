import cloudinary from '../config/cloudinary.js';
import catchAsync from '../utils/error/catchAsync.js';
import AppError from '../utils/error/appError.js';

const uploadToCloudinary = catchAsync(async (fileBuffer, folder) => {
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `stuidfy/${folder}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
        },
        (err, result) => (err ? reject(err) : resolve(result)),
      )
      .end(fileBuffer);
  });

  return uploadResult;
});

const deleteFromCloudinary = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });

  if (!['ok', 'not_found'].includes(result.result)) {
    throw new AppError('Failed to delete image', 500);
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
