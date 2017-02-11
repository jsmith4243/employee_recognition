var latex = require("latex");

var command = "C:\\Program \Files\\MiKTeX 2.9\\miktex\\bin\\x64\\miktex-pdflatex.exe";

var options = { command : command };

var award = {
    
    test: function() {
        return latex([
          "\\documentclass{article}",
          "\\begin{document}",
          "hello world",
          "\\end{document}"
        ], options);
    }

};
module.exports = award;