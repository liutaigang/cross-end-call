import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const plugins = [resolve({ extensions: ['.ts', '.js'] }), typescript({ tsconfig: './tsconfig.json' })];

export default {
  input: 'src/renderer.ts',
  plugins,
  output: {
    file: 'out/renderer.js',
    format: 'umd',
  },
};
