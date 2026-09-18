import type { FastifyPluginAsync } from 'fastify';

/**
 * Auth stubs.
 * TODO: integrate Clerk / Supabase Auth / Firebase Auth.
 * Hard gate: DOB → 18+ before creating a dating profile.
 */
export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/session', async (_req, reply) => {
    return reply.code(501).send({
      error: 'not_implemented',
      message: 'TODO: issue session via auth vendor',
    });
  });

  app.post('/age-gate', async (req, reply) => {
    const body = (req.body ?? {}) as { dateOfBirth?: string };
    if (!body.dateOfBirth) {
      return reply.code(400).send({ error: 'dateOfBirth_required' });
    }
    // Placeholder validation — real logic lives in modules/auth
    return {
      eligible: true,
      note: 'Stub response; wire DOB→age check in modules/auth',
    };
  });
};
