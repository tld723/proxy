// Serveur proxy pour les appels OpenAI
// Résout le problème CORS en faisant les appels depuis le backend

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS pour autoriser les requêtes depuis le frontend
app.use(cors({
  origin: ['https://keen-tiramisu-104b8a.netlify.app', 'http://localhost:5575', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Initialiser OpenAI avec la clé API depuis les variables d'environnement
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint pour les chat completions
app.post('/api/openai/chat/completions', async (req, res) => {
  try {
    console.log('[Proxy] Requête OpenAI reçue:', {
      model: req.body.model,
      messagesCount: req.body.messages?.length
    });

    const completion = await openai.chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: req.body.messages,
      temperature: req.body.temperature || 0.7,
      max_tokens: req.body.max_tokens,
      response_format: req.body.response_format
    });

    console.log('[Proxy] Réponse OpenAI reçue');
    res.json(completion);
  } catch (error) {
    console.error('[Proxy] Erreur OpenAI:', error.message);
    res.status(error.status || 500).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Endpoint pour créer un thread
app.post('/api/openai/threads', async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.json(thread);
  } catch (error) {
    console.error('[Proxy] Erreur création thread:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Endpoint pour ajouter un message à un thread
app.post('/api/openai/threads/:threadId/messages', async (req, res) => {
  try {
    const message = await openai.beta.threads.messages.create(
      req.params.threadId,
      req.body
    );
    res.json(message);
  } catch (error) {
    console.error('[Proxy] Erreur ajout message:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Endpoint pour créer un run
app.post('/api/openai/threads/:threadId/runs', async (req, res) => {
  try {
    const run = await openai.beta.threads.runs.create(
      req.params.threadId,
      req.body
    );
    res.json(run);
  } catch (error) {
    console.error('[Proxy] Erreur création run:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Endpoint pour récupérer un run
app.get('/api/openai/threads/:threadId/runs/:runId', async (req, res) => {
  try {
    const run = await openai.beta.threads.runs.retrieve(
      req.params.threadId,
      req.params.runId
    );
    res.json(run);
  } catch (error) {
    console.error('[Proxy] Erreur récupération run:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Endpoint pour annuler un run
app.post('/api/openai/threads/:threadId/runs/:runId/cancel', async (req, res) => {
  try {
    const run = await openai.beta.threads.runs.cancel(
      req.params.threadId,
      req.params.runId
    );
    res.json(run);
  } catch (error) {
    console.error('[Proxy] Erreur annulation run:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Endpoint pour récupérer les messages d'un thread
app.get('/api/openai/threads/:threadId/messages', async (req, res) => {
  try {
    const messages = await openai.beta.threads.messages.list(req.params.threadId);
    res.json(messages);
  } catch (error) {
    console.error('[Proxy] Erreur récupération messages:', error.message);
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur proxy OpenAI démarré sur le port ${PORT}`);
  console.log(`✅ CORS activé pour Netlify et localhost`);
  console.log(`📡 Prêt à recevoir les requêtes OpenAI`);
});
