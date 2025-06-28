
import { initTRPC, TRPCError } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  updateTaskStatusInputSchema,
  loginInputSchema,
  registerInputSchema,
  oauthInputSchema
} from './schema';

// Import handlers
import { register } from './handlers/auth/register';
import { login } from './handlers/auth/login';
import { oauth } from './handlers/auth/oauth';
import { getCurrentUser } from './handlers/auth/get_current_user';
import { createTask } from './handlers/tasks/create_task';
import { getTasks } from './handlers/tasks/get_tasks';
import { updateTask } from './handlers/tasks/update_task';
import { updateTaskStatus } from './handlers/tasks/update_task_status';
import { deleteTask } from './handlers/tasks/delete_task';

// Context type
interface Context {
  userId?: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Auth routes
  auth: router({
    register: publicProcedure
      .input(registerInputSchema)
      .mutation(({ input }) => register(input)),
    
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
    
    oauth: publicProcedure
      .input(oauthInputSchema)
      .mutation(({ input }) => oauth(input)),
    
    getCurrentUser: protectedProcedure
      .query(({ ctx }) => getCurrentUser(ctx.userId)),
  }),

  // Task routes
  tasks: router({
    create: protectedProcedure
      .input(createTaskInputSchema)
      .mutation(({ input, ctx }) => createTask(input, ctx.userId)),
    
    getAll: protectedProcedure
      .query(({ ctx }) => getTasks(ctx.userId)),
    
    update: protectedProcedure
      .input(updateTaskInputSchema)
      .mutation(({ input, ctx }) => updateTask(input, ctx.userId)),
    
    updateStatus: protectedProcedure
      .input(updateTaskStatusInputSchema)
      .mutation(({ input, ctx }) => updateTaskStatus(input, ctx.userId)),
    
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input, ctx }) => deleteTask(input.id, ctx.userId)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext({ req }) {
      // Extract user ID from Authorization header
      // For now, we'll implement a simple header-based auth
      // In production, you would validate JWT tokens here
      const authHeader = req.headers.authorization;
      let userId: string | undefined;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For demo purposes, we'll accept any token as a valid user ID
        // In production, decode and validate JWT token
        userId = authHeader.substring(7);
      }
      
      return { userId };
    },
  });
  
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
