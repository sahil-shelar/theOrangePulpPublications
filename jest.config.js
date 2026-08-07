const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
}

// @google/genai and its dependency tree ship ESM only. node_modules is not
// transformed by default, so importing anything that reaches gemini.ts — which
// is most of src/lib/generation — died with "Cannot use import statement outside
// a module" before a single assertion ran. That is a large part of why the
// pipeline had no tests.
//
// This cannot go in customJestConfig: next/jest sets transformIgnorePatterns
// itself and its value wins, so the override has to be applied to the resolved
// config after next/jest has built it. Hence the async function export rather
// than the usual one-liner.
const ESM_DEPS = ['@google/genai', 'p-retry', 'retry', 'is-network-error']

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    `/node_modules/(?!(${ESM_DEPS.join('|')})/)`,
    ...(config.transformIgnorePatterns ?? []).filter(p => !p.startsWith('/node_modules/')),
  ]
  return config
}
