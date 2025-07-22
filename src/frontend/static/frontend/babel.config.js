/**
 TODO: This configuration uses Babel and the React Compiler beta for React 18.
Once Ant Design 6 is released and the project is upgraded to React 19,
it is recommended to migrate from Babel to SWC for better performance and official support.
 */
export default {
  presets: [
    ['@babel/preset-env', { targets: 'defaults' }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['babel-plugin-react-compiler', { target: '18' }]
  ]
}