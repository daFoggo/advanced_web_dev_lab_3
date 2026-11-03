-- Better Auth reads its tables unqualified. A role-level default works through the Neon pooler,
-- which rejects the `options=-c search_path` startup parameter.
ALTER ROLE CURRENT_USER SET search_path = auth, public;
