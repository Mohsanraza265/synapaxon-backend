// Question.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'raw', 'url', 'youtube'], // Add 'raw' for non-image/video files (e.g., PDF)
        required: true
    },
    path: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: function() { return this.mimetype !== 'text/url'; }
    }
});

// Helper to map Cloudinary resource_type to mediaSchema type
const mapCloudinaryType = (resourceType) => {
    if (resourceType === 'image') return 'image';
    if (resourceType === 'video') return 'video';
    if (resourceType === 'raw') return 'raw';
    if (resourceType === 'youtube') return 'youtube';
    return 'url';
};

// Update media validation in questionSchema
const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    media: [mediaSchema]
});

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    questionMedia: [mediaSchema],
    options: {
        type: [optionSchema],
        required: true,
        validate: {
            validator: function(arr) {
                return arr.length >= 2;
            },
            message: 'At least two options are required'
        }
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0
    },
    explanation: {
        type: String,
        required: true,
        trim: true
    },
    explanationMedia: [mediaSchema],
    category: {
        type: String,
        required: true,
        enum: ['Basic Sciences', 'Organ Systems', 'Clinical Specialties']
    },
    subjects: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        topics: [{
            type: String,
            trim: true
        }]
    }],
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    tags: [{
        type: String,
        trim: true
    }],
    sourceUrl: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
questionSchema.index({ createdBy: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ 'subjects.name': 1 });

// Ensure correctAnswer is valid
questionSchema.pre('validate', function(next) {
    if (this.options && (this.correctAnswer < 0 || this.correctAnswer >= this.options.length)) {
        next(new Error('Correct answer index is out of range'));
    } else {
        next();
    }
});




// Question.js
// ... Existing imports and schemas ...

// Delete associated media files from Cloudinary before deleting the question
questionSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const cloudinary = require('cloudinary').v2;
        const config = require('../config/config');

        cloudinary.config({
            cloud_name: config.CLOUDINARY_CLOUD_NAME,
            api_key: config.CLOUDINARY_API_KEY,
            api_secret: config.CLOUDINARY_API_SECRET
        });

        // Función para extraer public ID de path y determinar tipo de recurso
        const getCloudinaryInfo = (media) => {
            const publicId = `synapaxon_uploads/${media.filename}`;

            // Verificar si es video (YouTube u otros)
            const isVideo = media.path && (
                /youtube\.com|youtu\.be/i.test(media.path) ||
                media.path.includes('youtube') ||
                media.path.includes('youtu.be') ||
                /\.(mp4|mov|avi|webm)$/i.test(media.path)
            );

            return {
                publicId,
                resourceType: isVideo ? 'video' : 'image' // asumimos que si no es video es imagen
            };
        };

        // Obtener todos los medios a eliminar con su tipo de recurso
        const allMedia = [
            ...this.questionMedia,
            ...this.explanationMedia,
            ...this.options.flatMap(option => option.media)
        ];

        // Eliminar cada recurso con el tipo correcto
        await Promise.all(
            allMedia.map(media => {
                const { publicId, resourceType } = getCloudinaryInfo(media);
                return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            })
        );

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Question', questionSchema);