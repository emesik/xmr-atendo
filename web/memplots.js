function drawTimelines(rootUrl, txns, totals, averages, perkbs) {
  var data = {
    txns: [],
    totals: [],
    averages: [],
    perkbs: []
  };
  var plots = {
    txns: null,
    totals: null,
    averages: null,
    perkbs: null
  };
  var colors = ['#ff6600', '#0099ff', '#4c4c4c'];
  var sizeFeeOptions = {
    colors: colors,
    xaxes: [{
      mode: 'time',
      minTickSize: [1, "hour"]
    }],
    yaxes: [
      {
        min: 0,
        tickFormatter: kBFormatter
      }, {
        min: 0,
        position: 'right',
        alignTickWithAxis: 1,
        tickFormatter: xmrFormatter
      }
    ],
    legend: { position: 'nw' }
  };

  [txns, totals, averages, perkbs].forEach(function(e) {
    e.parent().resizable({
      minWidth: 300,
      maxWidth: 1200,
      minHeight: 300,
      maxHeight: 400
    });
  });

  // txns
  $.ajax({
    url: rootUrl + 'timeline-txns.json',
    success: function(result) {
      data.txns.push(result.data);
      plots.txns = txns.plot(data.txns, {
        colors: colors,
        xaxis: {
          mode: 'time',
          minTickSize: [1, "hour"]
        }
      });
    }
  });

  // totals
  var t1 = $.ajax({
    url: rootUrl + 'timeline-sumsize.json',
    success: function(result) {
      data.totals.push({
        label: 'Mempool size',
        data: result.data,
        index: 10
      });
    }
  });
  var t2 = $.ajax({
    url: rootUrl + 'timeline-sumfee.json',
    success: function(result) {
      data.totals.push({
        label: 'Total fees',
        yaxis: 2,
        data: result.data,
        index: 20
      });
    }
  });
  $.when(t1, t2).done(function() {
    data.totals.sort(cmpIndex);
    plots.totals = totals.plot(data.totals, sizeFeeOptions);
  });

  // averages
  var a1 = $.ajax({
    url: rootUrl + 'timeline-avgsize.json',
    success: function(result) {
      data.averages.push({
        label: 'Avg txn size',
        data: result.data,
        index: 10
      });
    }
  });
  var a2 = $.ajax({
    url: rootUrl + 'timeline-avgfee.json',
    success: function(result) {
      data.averages.push({
        label: 'Avg txn fee',
        yaxis: 2,
        data: result.data,
        index: 20,
      });
    }
  });
  $.when(a1, a2).done(function() {
    data.averages.sort(cmpIndex);
    plots.averages = averages.plot(data.averages, sizeFeeOptions);
  });

  // per kB
  $.ajax({
    url: rootUrl + 'timeline-avgfeeperkb.json',
    success: function(result) {
      data.perkbs.push({
        label: 'Avg fee per kB',
        yaxis: 2,
        data: result.data,
        index: 10
      });
      plots.perkbs = perkbs.plot(data.perkbs, {
        colors: colors,
        xaxis: {
          mode: 'time',
          minTickSize: [1, "hour"]
        },
        yaxis: {
          min: 0,
          position: 'right',
          tickFormatter: mxmrFormatter
        },
        legend: { position: 'nw' }
      });
    }
  });

  // functions
  function xmrFormatter(v) {
    if (Math.abs(v) < 0.01) return '0 XMR';
    return v.toFixed(2) + ' XMR';
  }

  function mxmrFormatter(v) {
    if (Math.abs(v) < 0.00001) return '0 mXMR';
    return (v * 1000).toFixed(1) + ' mXMR';
  }

  function kBFormatter(v) {
    var kb = v / 1024.0;
    if (Math.abs(v) < 0.1) return '0 kB';
    if (kb > 1024) return (kb / 1024.0).toFixed(1) + ' MB';
    return kb.toFixed(kb >= 100 ? 0 : 1) + ' kB';
  }

  function cmpIndex(a, b) {
    return (a.index - b.index) || 0;
  }
}
