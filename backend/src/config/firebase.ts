// Configuração do Firebase Admin SDK para verificação de tokens JWT
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Inicializa o Firebase Admin apenas uma vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A chave privada vem com \n como string — converte para quebras de linha reais
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  console.log('[Firebase] Admin SDK inicializado com sucesso');
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
