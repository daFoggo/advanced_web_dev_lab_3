import { nextJsConfig } from "@workspace/eslint-config/next-js"

const layerRestrictions = [
  {
    group: ["@/app", "@/app/**"],
    message: "features/ must not import from app/.",
  },
  {
    group: ["@/features", "@/features/**"],
    message:
      "Features must not import other features. Compose them in app/, and use relative imports inside a feature.",
  },
]

const featureRestrictions = layerRestrictions

const authRestrictedGroup = [
  "@/lib/auth",
  "@workspace/auth/server",
  "@workspace/auth/config",
]

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: featureRestrictions }],
    },
  },
  {
    // The selector is the one file that imports both data paths.
    files: ["features/*/server.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: layerRestrictions }],
    },
  },
  {
    // Declared after the block above so this rule set replaces it for components/.
    files: ["features/*/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureRestrictions,
            {
              group: [
                "**/server",
                "**/server.*",
                "**/queries",
                "@/lib/dal",
                "@workspace/db/neon",
                ...authRestrictedGroup,
              ],
              message:
                "Feature components must not import server-only modules (server, queries, dal, db, auth).",
            },
          ],
        },
      ],
    },
  },
  {
    // App shell components may be client components; auth config holds secrets.
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/dal",
                "@workspace/db/neon",
                ...authRestrictedGroup,
              ],
              message:
                "Shared components must not import server-only modules (dal, db, auth).",
            },
          ],
        },
      ],
    },
  },
]
