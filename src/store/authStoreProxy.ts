// Thin re-export so store/index.ts can dynamically import useAuthStore
// without creating a circular dependency at module load time.
export { useAuthStore } from '../lib/auth';
