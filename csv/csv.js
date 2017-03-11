var csv = {
    escapeCsv: function (str) {
        var res = str;
        var hasQuotes = str.includes('"');
        if (hasQuotes) {
            res = str.replace('"', '""');
        }
        if (hasQuotes || str.includes(',') || str.includes('\n')) {
            res = '"' + res + '"';
        }
        return res;
    },

    export: function (arr, columns, names) {
        var lines = [];
        var header = [];
        (names || columns).forEach(function (col) {
            header.push(csv.escapeCsv(col));
        })
        lines.push(header.join(','));
        arr.forEach(function (row) {
            var cols = [];
            columns.forEach(function (col) {
                if (row[col]) {
                    cols.push(csv.escapeCsv(row[col].toString()));
                }
                else {
                    cols.push('');
                }
            });
            lines.push(cols.join(','));
        });
        return lines.join('\n');
    }
};

module.exports = csv;