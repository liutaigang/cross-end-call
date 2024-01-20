import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import merge from 'rollup-merge-config';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json'));

// 打包任务的个性化配置
const cecJobs = {
  cjs: {
    output: { format: 'cjs', file: pkg.exports['.'].require },
  },
  esm: {
    output: { format: 'esm', file: pkg.exports['.'].import },
  },
  dts: {
    output: { format: 'es', file: pkg.exports['.'].types },
    plugins: [dts()],
  },
};

const decoratorJobs = {
  cjs: {
    output: { format: 'cjs', file: pkg.exports['./decorator'].require },
  },
  esm: {
    output: { format: 'esm', file: pkg.exports['./decorator'].import },
  },
  dts: {
    output: { format: 'es', file: pkg.exports['./decorator'].types },
    plugins: [dts()],
  },
};

const plugins = [
  resolve({
    extensions: ['.ts', '.js'],
  }),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfig: './tsconfig.json',
  }),
];

const cecConfig = merge(
  {
    input: './src/index.ts',
    plugins,
  },
  cecJobs[process.env.NODE_ENV || 'cjs'],
);

const decoratorConfig = merge(
  {
    input: './src/decorator/index.ts',
    plugins,
  },
  decoratorJobs[process.env.NODE_ENV || 'cjs'],
);

export default [cecConfig, decoratorConfig];
