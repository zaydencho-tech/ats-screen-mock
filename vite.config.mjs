import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import ts from 'typescript';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(root, 'src/app/');
const sourceStates = {
  name: 'original-source-states', enforce: 'pre',
  transform(code, id) {
    if (!id.startsWith(app) || !id.endsWith('.tsx')) return;
    const file = 'itcen-ats-frontend/' + path.relative(root, id).split(path.sep).join('/');
    const ast = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const edits = [];
    const visit = node => {
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast) === 'useState') {
        const variable = node.name.elements[0]?.name?.getText(ast);
        const call = node.initializer;
        const value = call.arguments[0];
        if (variable && value) {
          edits.push({ start: call.expression.getStart(ast), end: call.expression.end, text: 'window.__ATS_PREVIEW__.hook' });
          edits.push({ start: value.getStart(ast), end: value.getStart(ast), text: `${JSON.stringify(file + '#' + variable)}, ` });
        }
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^[a-z]/.test(node.tagName.getText(ast))) {
        edits.push({ start: node.tagName.end, end: node.tagName.end, text: ` data-ats-source=${JSON.stringify(file)} data-ats-line=${JSON.stringify(String(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1))}` });
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    edits.sort((a, b) => b.start - a.start);
    for (const edit of edits) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
    return { code, map: null };
  },
};

export default defineConfig({
  root, envDir: false, envPrefix: 'UNUSED_ATS_MOCK_', base: process.env.ATS_BASE_PATH || '/', publicDir: false,
  plugins: [sourceStates, {
    name: 'original-figma-assets',
    resolveId(id) { if (id.startsWith('figma:asset/')) return path.join(root, 'src/assets', id.slice(12)); },
  }, react(), tailwind()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/__ats_fixture__/'), 'import.meta.env.VITE_AGENTGO_ENABLED': '"false"', 'import.meta.env.DEV': 'false' },
  css: { postcss: { plugins: [] } },
  build: { target: 'esnext', outDir: 'dist', emptyOutDir: true, sourcemap: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { input: { index: path.join(root, 'index.html'), renderer: path.join(root, 'render/index.html') } },
  },
});
