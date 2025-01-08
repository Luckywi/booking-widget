import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: 'src/widget.ts',
  output: {
    file: 'public/widget.js',
    format: 'iife',
    name: 'BookingWidget',
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM'
    }
  },
  external: ['react', 'react-dom'],
  plugins: [
    resolve({ 
      extensions,
      moduleDirectories: ['node_modules']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      jsx: 'react'
    }),
    babel({
      babelHelpers: 'bundled',
      extensions,
      configFile: './babel.config.rollup.json',
      exclude: 'node_modules/**'
    })
  ]
};