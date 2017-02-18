var latex = require("latex");
var moment = require('moment');

var command = "C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64\\miktex-pdflatex.exe";

var options = { command : command };

var award = {
    
    test: function() {
        return latex([
            ' \\documentclass[12pt,letter]{article}\\usepackage[landscape,margin=1in]{geometry}\\usepackage{lmodern}\\begin{document}\\begin{center}\\pagenumbering{gobble}{',
            ' {\\fontsize{28pt}{48pt}\\selectfont',
            ' Gemini Company',
            ' }\\\\[24pt]{\\fontsize{36pt}{96pt}\\selectfont',
            ' Award Certificate',
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{awarded to}}\\\\[24pt]{\\fontsize{48pt}{5cm}\\selectfont',
            ' Recipient',
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{for}}\\\\[24pt]{\\fontsize{36pt}{5cm}\\selectfont',
            ' Employee of the Month',
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont',
            ' Feburary 10, 2007',
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{by}}\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont',
            ' Sender',
            ' }}\\end{center}\\end{document}',
        ], options);
    },

    generate: function(name, awardtype, date, sender) {
        return latex([
            ' \\documentclass[12pt,letter]{article}\\usepackage[landscape,margin=1in]{geometry}\\usepackage{lmodern}\\begin{document}\\begin{center}\\pagenumbering{gobble}{',
            ' {\\fontsize{28pt}{48pt}\\selectfont',
            ' Gemini Company',
            ' }\\\\[24pt]{\\fontsize{36pt}{96pt}\\selectfont',
            ' Award Certificate',
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{awarded to}}\\\\[24pt]{\\fontsize{48pt}{5cm}\\selectfont',
            ' ' + name,
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{for}}\\\\[24pt]{\\fontsize{36pt}{5cm}\\selectfont',
            ' ' + awardtype,
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont',
            ' ' + moment(date, "X").format("MMMM D, YYYY"),
            ' }\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont\\emph{by}}\\\\[24pt]{\\fontsize{24pt}{5cm}\\selectfont',
            ' ' + sender,
            ' }}\\end{center}\\end{document}',
        ], options);
    }



};
module.exports = award;