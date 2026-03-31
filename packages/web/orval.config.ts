import { defineConfig } from 'orval';

export default defineConfig({
  'talent-lens': {
    input: {
      target: '../api/openapi.yaml',
    },
    output: {
      mode: 'tags',
      target: 'src/api/services/generated',
      schemas: 'src/api/model',
      client: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './src/api/client/orval-mutator.ts',
          name: 'orvalMutator',
        },
      },
    },
  },
});
