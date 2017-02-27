var latex = require("latex");
var moment = require('moment');
var path = require('path');

var command = "C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64\\miktex-pdflatex.exe";

var options = { command : command };

var award = {
    
    test: function() {
        return this.generate('Recipient', 'Employee of the Month', 0, 'Sender', 'placeholder2');
    },

    generate: function(name, awardtype, date, sender, signature) {
        console.log('graphic: ' + path.posix.resolve('uploads/' + signature));
        return latex([
            ' \\documentclass[12pt,letter]{article}\\usepackage[landscape,margin=1in]{geometry}\\usepackage{lmodern}\\usepackage{graphicx}\\begin{document}\\begin{center}\\pagenumbering{gobble}{',
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
            ' ' + sender + '}',
            ' \\\\[6pt]',
            ' \\includegraphics[height=0.5in]{' + path.posix.resolve('uploads/' + signature).replace('\\', '/') + '}',
            ' }\\end{center}\\end{document}',
        ], options);
    }



};
module.exports = award;