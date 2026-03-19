module.exports = {
  style: {
    postcss: {
      mode: "extends",
      plugins: [
        require('postcss-pxtorem')({
          rootValue: 16,      // 1rem = 16px
          unitPrecision: 5,   // Počet desetinných míst
          propList: ['*'],    // Převést všechny vlastnosti (font-size, width, padding...)
          selectorBlackList: [], // Třídy, které mají zůstat v px (např. ['.ignore'])
          replace: true,      // Nahradí px za rem (v prohlížeči uvidíš už jen rem)
          mediaQuery: false,  // Pokud chceš px v @media queries nechat, dej false
          minPixelValue: 2    // Hodnoty jako 1px (rámečky) zůstanou v pixelech
        }),
      ],
    },
  },
};