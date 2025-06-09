const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// Configuración de Friendli.ai
const FRIENDLI_API_URL = 'https://api.friendli.ai/dedicated/deppq1w7jfi20c7'; // Reemplaza con tu endpoint
const FRIENDLI_API_TOKEN = process.env.FRIENDLI_API_TOKEN; // Reemplaza con tu token real

// Función para generar preguntas usando Friendli.ai
const generateQuestionsFromText = async (text, instructions, literalMode) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      throw new Error('El texto proporcionado es demasiado corto o inválido.');
    }

    // Construcción del prompt
    let userPrompt = `Genera preguntas de opción múltiple basadas en el siguiente texto:\n"${text}".\n`;
    if (instructions) userPrompt += `Instrucciones adicionales: ${instructions}\n`;
    userPrompt += literalMode
      ? 'Interpreta el texto de manera literal.'
      : 'Sé creativo y genera preguntas variadas.';
    userPrompt += '\nFormato de salida (JSON):\n';
    userPrompt += `[{
      "questionText": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "explanation": "..."
    }]`;

    // Llamada a la API de chat de Friendli
    const response = await axios.post(
      FRIENDLI_API_URL + '/v1/chat/completions',
      {
        messages: [
          { role: 'system', content: 'Eres un generador de preguntas.' },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${FRIENDLI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedData = response.data.choices?.[0]?.message?.content;
    if (!generatedData) throw new Error('La API no devolvió contenido válido.');

    // Parsear contenido
    try {
      const questions = JSON.parse(generatedData);
      return {
        success: true,
        data: questions.map((q, index) => ({
          id: `q-${Date.now()}-${index}`,
          ...q,
        })),
      };
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError);
      throw new Error('La API devolvió un formato no válido.');
    }
  } catch (error) {
    console.error('Error en generateQuestionsFromText:', error.message);
    return {
      success: false,
      message: error.message || 'Error al generar preguntas.',
    };
  }
};


// Ruta POST
router.post('/generate-questions-from-text', protect, async (req, res) => {
  const { raw_text, literal_mode, instructions } = req.body;
  const text = raw_text || req.body.text;
  const literalMode = literal_mode ?? req.body.literalMode ?? false;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere texto para generar preguntas.',
    });
  }

  const result = await generateQuestionsFromText(text, instructions, literalMode);
  res.status(result.success ? 200 : 400).json(result);
});

module.exports = router;