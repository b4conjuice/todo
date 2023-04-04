/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  singleQuote: true,
  jsxSingleQuote: true,
  printWidth: 80,
  trailingComma: "es5",
  arrowParens: "avoid",
  endOfLine: "auto",
  semi: false,
};

module.exports = config;
