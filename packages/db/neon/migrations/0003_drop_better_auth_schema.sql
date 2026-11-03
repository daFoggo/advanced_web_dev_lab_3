-- Better Auth is gone: Neon Auth keeps its users in neon_auth. Reset the role default set by 0001.
ALTER ROLE CURRENT_USER RESET search_path;
DROP SCHEMA IF EXISTS auth CASCADE;
