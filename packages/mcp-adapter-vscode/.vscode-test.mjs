import { defineConfig } from '@vscode/test-cli';

// https://code.visualstudio.com/api/working-with-extensions/testing-extension
export default defineConfig({
	files: 'out/test/**/*.test.js',
});
