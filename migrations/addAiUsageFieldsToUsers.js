const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

async function migrate() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Actualizar todos los usuarios existentes
    const result = await User.updateMany(
      {}, // Filtro vacío para seleccionar todos los usuarios
      {
        $set: {
          aiUsageCount: 0,
          aiUsageLimit: 5, // Valor por defecto para el plan free
        },
      }
    );

    console.log(`Migration successful. Updated ${result.nModified} users.`);

    // Cerrar la conexión
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();